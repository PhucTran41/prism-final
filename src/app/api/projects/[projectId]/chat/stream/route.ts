import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/backend/modules/presentation/project/handlers';
import { z } from 'zod';
import { chatOrchestrate } from '@/backend/modules/presentation/chat/handlers';
import { ARTIFACTS, findArtifactById } from '@/backend/modules/presentation/chat/artifacts';
import { ChatPrismaRepo } from '@/backend/modules/infrastructure/chat/prisma/repo';

const bodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user','assistant','system']), content: z.string() })).min(1),
  threadId: z.number().optional(),
  visibility: z.enum(['private','unlisted','public']).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) return new Response('Unauthorized', { status: 401 });
  const email = session.user.email;
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return new Response('Invalid projectId', { status: 400 });
  const owned = await getOwnedProjectByEmail(email, id);
  if (!owned) return new Response('Forbidden', { status: 403 });
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response('Invalid payload', { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const repo = new ChatPrismaRepo();
        let threadId = parsed.data.threadId;
        if (!threadId) {
          const user = await prismaUserIdByEmail(email);
          if (!user) throw new Error('User not found');
          const t = await repo.createThread(id, user.id, parsed.data.visibility ?? 'private');
          threadId = t.id;
        }
        // persist user message (last one)
        const last = parsed.data.messages[parsed.data.messages.length - 1];
        if (last?.role === 'user') {
          await repo.addMessage(threadId!, 'user', last.content);
        }
        write({ threadId });
        // fetch thread (for meta)
        const thread = await repo.getThread(threadId!);
        type PhaseMeta = {
          phase: 'brief' | 'scope' | 'epics' | 'stories' | 'roadmap' | 'risks' | null;
          step: number;
          answers: Record<string, unknown>;
          suggestions?: Record<string, string[]>;
        };
        const existingMeta = (thread as unknown as { meta?: PhaseMeta })?.meta ?? null;
        let meta: PhaseMeta = existingMeta ?? { phase: null, step: 0, answers: {} };
        const lastUserMsg: { role: string; content: string } | undefined =
          (parsed.data.messages as Array<{ role: string; content: string }>).filter(m => m.role === 'user').slice(-1)[0];
        const lastUserText = (lastUserMsg?.content ?? '').trim();

        // Helper: parse commands
        // Natural language mapping to commands
        const toCmd = (s: string): { cmd: string|null; arg?: string|null } => {
          const t = s.trim().toLowerCase();
          if (!t) return { cmd: null };
          if (t.startsWith('/')) {
            const m = t.match(/^\/(\w+)(?:\s+(.+))?$/);
            return { cmd: m?.[1]?.toLowerCase() ?? null, arg: m?.[2] ?? null };
          }
          if (/\b(continue|go on|next)\b/.test(t)) return { cmd: 'next' };
          if (/\b(back|previous)\b/.test(t)) return { cmd: 'back' };
          if (/\b(done|looks good|confirm|generate it)\b/.test(t)) return { cmd: 'confirm' };
          if (/\b(skip|not sure|unknown)\b/.test(t)) return { cmd: 'skip' };
          if (/\b(give me options|suggest|candidates)\b/.test(t)) return { cmd: 'suggest' };
          if (/\b(help|examples?)\b/.test(t)) return { cmd: 'help' };
          if (/\b(start over|reset|restart)\b/.test(t)) return { cmd: 'restart' };
          if (/brainstorm (brief|scope|epics?|stories|roadmap)/.test(t)) {
            const m = t.match(/brainstorm (brief|scope|epics?|stories|roadmap)/);
            return { cmd: 'brainstorm', arg: m?.[1]?.replace('epic', 'epics') ?? null };
          }
          return { cmd: null };
        };
        const mapped = toCmd(lastUserText);
        const cmdMatch = (mapped.cmd ? [null, mapped.cmd, mapped.arg] : lastUserText.match(/^\/(\w+)(?:\s+(.+))?$/));
        const cmd = cmdMatch?.[1]?.toLowerCase() ?? null;
        const arg = cmdMatch?.[2]?.toLowerCase() ?? null;

        // Phase config
        const stepsByPhase: Record<string, number> = {
          brief: 5,       // problem, users, goals, constraints, confirm
          scope: 5,       // must, should, could, non_goals, confirm
          epics: 4,       // themes, outcomes, priorities, confirm
          stories: 4,     // epicTitles, seeds, acceptance, confirm
          roadmap: 3,     // scheduling, milestones, confirm
          risks: 3,       // prompts, list, confirm (future)
        };
        const fieldFor = (phase: string, step: number): string | null => {
          const map: Record<string, string[]> = {
            brief: ['problem', 'targetUsers', 'goals', 'constraints', 'confirm'],
            scope: ['must', 'should', 'could', 'non_goals', 'confirm'],
            epics: ['themes', 'outcomes', 'priorities', 'confirm'],
            stories: ['epicTitles', 'seeds', 'acceptance', 'confirm'],
            roadmap: ['schedule', 'milestones', 'confirm'],
            risks: ['prompts', 'list', 'confirm'],
          };
          const arr = map[phase] || [];
          return arr[step - 1] ?? null;
        };

        const detectArtifactFromText = (s: string) => {
          const text = s || '';
          const a = (ARTIFACTS as ReadonlyArray<{ id: string; detect: (t: string) => boolean }>).find(x => x.detect(text));
          return a?.id ?? null;
        };
        const wantsSaveArtifact = (s: string): string | null => {
          const m = (s || '').trim().toLowerCase();
          if (!m) return null;
          const ids = (ARTIFACTS as ReadonlyArray<{ id: string }>).map(a => a.id);
          const saveCmd = m.match(new RegExp(`^\\/?save\\s+(${ids.join('|')})s?\\b`));
          if (saveCmd) {
            const k = saveCmd[1].replace(/s$/, '');
            return k;
          }
          if (/\bsave\b/.test(m)) {
            const cfg = findArtifactById(meta.phase);
            if (cfg) return cfg.id;
          }
          return null;
        };

        // Mutate meta by command
        const persistMeta = async (nextMeta: PhaseMeta) => {
          await repo.updateMeta(threadId!, nextMeta);
          meta = nextMeta;
        };

        const isPhase = (p?: string | null) => p && stepsByPhase[p] != null;

        if (cmd === 'brainstorm' && isPhase(arg)) {
          const next: PhaseMeta = { phase: arg as PhaseMeta['phase'], step: 1, answers: {} };
          await persistMeta(next);
        } else if (cmd && isPhase(cmd)) {
          // Treat direct commands like /brief, /scope, /epics, /stories, /roadmap, /risks as phase starters
          const next: PhaseMeta = { phase: cmd as PhaseMeta['phase'], step: 1, answers: {} };
          await persistMeta(next);
        } else if (!cmd) {
          // Fallback: detect "Topic: <phase>" inside expanded messages from client brainstorm helper
          const topic = lastUserText.match(/topic:\s*(brief|scope|epics?|stories|roadmap|risks)/i)?.[1]?.toLowerCase();
          if (isPhase(topic)) {
            const normalized = (topic as string).replace('epic', 'epics') as PhaseMeta['phase'];
            const next: PhaseMeta = { phase: normalized, step: 1, answers: {} };
            await persistMeta(next);
          }
        } else if (cmd === 'next' && isPhase(meta.phase)) {
          const max = stepsByPhase[meta.phase as string];
          const step = Math.min((meta.step ?? 1) + 1, max);
          await persistMeta({ ...meta, step });
        } else if (cmd === 'back' && isPhase(meta.phase)) {
          const step = Math.max((meta.step ?? 1) - 1, 1);
          await persistMeta({ ...meta, step });
        } else if (cmd === 'restart' && isPhase(meta.phase)) {
          await persistMeta({ phase: meta.phase, step: 1, answers: {} });
        } else if (cmd === 'confirm' && isPhase(meta.phase)) {
          // Build proposals deterministically from meta.answers
          const proposals: unknown[] = [];
          const projectName = owned.name ?? 'Project';
          switch (meta.phase) {
            case 'brief':
              proposals.push({
                kind: 'brief.generate',
                payload: {
                  name: projectName,
                  problem: meta.answers?.problem ?? '',
                  targetUser: Array.isArray(meta.answers?.targetUsers) ? meta.answers.targetUsers.join('\n') : (meta.answers?.targetUsers ?? ''),
                  goals: Array.isArray(meta.answers?.goals) ? meta.answers.goals.join('\n') : (meta.answers?.goals ?? ''),
                  constraints: Array.isArray(meta.answers?.constraints) ? meta.answers.constraints.join('\n') : (meta.answers?.constraints ?? ''),
                },
              });
              break;
            case 'scope':
              proposals.push({
                kind: 'scope.generate',
                payload: {
                  name: projectName,
                  must: meta.answers?.must ?? '',
                  should: meta.answers?.should ?? '',
                  could: meta.answers?.could ?? '',
                  non_goals: meta.answers?.non_goals ?? '',
                },
              });
              break;
            case 'epics':
              proposals.push({
                kind: 'epics.generate',
                payload: { name: projectName, strictness: 'normal' },
              });
              break;
            case 'stories':
              proposals.push({
                kind: 'stories.generate',
                payload: {
                  name: projectName,
                  epicTitles: Array.isArray(meta.answers?.epicTitles)
                    ? meta.answers.epicTitles
                    : String(meta.answers?.epicTitles ?? '')
                        .split('\n')
                        .map(s => s.trim())
                        .filter(Boolean),
                  strictness: 'normal',
                },
              });
              break;
            case 'roadmap':
              proposals.push({
                kind: 'roadmap.generate',
                payload: {
                  name: projectName,
                  cadence: 'monthly',
                },
              });
              break;
            default:
              break;
          }
          // Clear phase or keep for review
          await persistMeta({ phase: null, step: 0, answers: {} });
          write({ type: 'data-finish', text: 'Ready. Generated proposals from your brainstorming.' });
          write({ type: 'data-proposals', proposals });
          controller.close();
          return;
        } else if (cmd === 'help' && isPhase(meta.phase)) {
          const key = fieldFor(meta.phase as string, meta.step);
          const hints: Record<string, string> = {
            problem: 'Describe the single most important pain or unmet need your product addresses.',
            targetUsers: 'List primary and secondary users (e.g., busy professionals, students).',
            goals: '2–3 outcomes you want users to achieve (e.g., “3 active days/wk”, “consistent routine”).',
            constraints: 'List what you will not include in MVP or constraints that apply.',
            must: 'Features that are absolutely required for MVP.',
            should: 'Important features that can be deferred if needed.',
            could: 'Nice‑to‑have ideas.',
            non_goals: 'What is explicitly out of scope.',
            themes: 'High‑level epic themes (e.g., Logging, Reminders, Streaks, Snapshot).',
            outcomes: 'User outcomes per theme.',
            priorities: 'Assign M/S/C per theme.',
            epicTitles: 'Which epics to target first? Provide titles.',
            seeds: 'Story ideas per epic.',
            acceptance: 'Acceptance hints or conditions per story seed.',
            schedule: 'cadence, horizonMonths, startDate, teamSize, velocityPointsPerSprint, includeStorySchedule',
            milestones: 'Named releases or milestones.',
          };
          write({ type: 'data-finish', text: `Here are examples for ${meta.phase}.${key}:\n\n- ${hints[key ?? ''] ?? 'Provide concise, user‑focused input.'}\n\nReply with your answer, or type /suggest for candidates.` });
          controller.close();
          return;
        } else if (cmd === 'suggest' && isPhase(meta.phase)) {
          const key = fieldFor(meta.phase as string, meta.step);
          const suggestPrompt = [
            'Suggest 5 concise candidate answers as bullet points for the current step.',
            `Phase: ${meta.phase}; Step: ${meta.step}; Field: ${key}`,
            'Use project context if helpful. Only output bullet points, no extra text.',
          ].join('\n');
          const messagesForSuggest = [
            ...(parsed.data.messages as Array<{ role: string; content: string }>).map(m => ({
              role: m.role as 'user'|'assistant'|'system',
              content: m.content,
            })),
            { role: 'system' as const, content: JSON.stringify({ threadMeta: meta }) },
            { role: 'user' as const, content: suggestPrompt }
          ] as Array<{ role: 'user'|'assistant'|'system'; content: string }>;
          let suggestText = '';
          const result = await chatOrchestrate(id, messagesForSuggest, (delta: string) => { suggestText += delta; });
          const final = parseChatJson(result?.raw ?? '')?.text ?? suggestText;
          // Store parsed suggestions (simple split)
          const list = (final || '').split('\n').map(l => l.replace(/^[-*\d\.\s]+/, '').trim()).filter(Boolean).slice(0, 10);
          const nextSuggestions: Record<string, string[]> = { ...(meta.suggestions ?? {}) };
          if (key) nextSuggestions[key] = list;
          await persistMeta({ ...meta, suggestions: nextSuggestions });
          write({ type: 'data-finish', text: final || '• Option A\n• Option B\n• Option C' });
          controller.close();
          return;
        } else if (cmd === 'pick' && isPhase(meta.phase)) {
          const m = lastUserText.match(/\/pick\s+(\d+)/i);
          const n = m ? parseInt(m[1], 10) : NaN;
          const key = fieldFor(meta.phase as string, meta.step);
          const pool = key ? meta.suggestions?.[key] : undefined;
          if (!isNaN(n) && pool && pool[n - 1]) {
            const answers = { ...(meta.answers ?? {}), [key as string]: pool[n - 1] };
            const s = { ...(meta.suggestions ?? {}) };
            if (key) {
              // remove picked list for this key
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [key]: _omit, ...rest } = s;
              await persistMeta({ ...meta, answers, suggestions: rest });
            } else {
              await persistMeta({ ...meta, answers });
            }
            write({ type: 'data-finish', text: `Picked option ${n}.` });
            controller.close();
            return;
          }
        } else if (cmd === 'skip' && isPhase(meta.phase)) {
          const key = fieldFor(meta.phase as string, meta.step);
          const answers = { ...(meta.answers ?? {}), [key as string]: '—' };
          await persistMeta({ ...meta, answers, step: Math.min((meta.step ?? 1) + 1, stepsByPhase[meta.phase as string]) });
          write({ type: 'data-finish', text: 'Skipped. Proceeding to next step.' });
          controller.close();
          return;
        } else if (cmd === 'auto' && isPhase(meta.phase)) {
          const key = fieldFor(meta.phase as string, meta.step);
          const answers = { ...(meta.answers ?? {}), [key as string]: 'Auto‑filled (review later).' };
          await persistMeta({ ...meta, answers, step: Math.min((meta.step ?? 1) + 1, stepsByPhase[meta.phase as string]) });
          write({ type: 'data-finish', text: 'Auto‑filled from context. Proceeding to next step.' });
          controller.close();
          return;
        } else if (cmd === 'undo' && isPhase(meta.phase)) {
          const key = fieldFor(meta.phase as string, meta.step);
          const answers = { ...(meta.answers ?? {}) };
          if (key && Object.prototype.hasOwnProperty.call(answers, key)) delete (answers as Record<string, unknown>)[key];
          await persistMeta({ ...meta, answers });
          write({ type: 'data-finish', text: 'Undone. You can provide a new answer for this step.' });
          controller.close();
          return;
        } else if (cmd === 'review' && isPhase(meta.phase)) {
          const pretty = Object.entries(meta.answers ?? {}).map(([k,v]) => `- ${k}: ${String(v)}`).join('\n') || '(no answers yet)';
          write({ type: 'data-finish', text: `Answers so far for ${meta.phase}:\n\n${pretty}\n\nUse /back, /next, or /confirm.` });
          controller.close();
          return;
        } else if (!cmd && isPhase(meta.phase)) {
          // If the user asks a general question while in a phase, gently redirect without mutating meta
          const likelyQuestion = /\?|^\s*(what|how|why|when|where)\b/i.test(lastUserText);
          if (likelyQuestion) {
            const hint = `We're currently on Phase ${meta.phase}, Step ${meta.step}. You can continue (/next), go back (/back), see suggestions (/suggest), or /confirm when ready.`;
            write({ type: 'data-finish', text: hint });
            controller.close();
            return;
          }
          // Treat the message as an answer for current step
          const key = fieldFor(meta.phase as string, meta.step);
          if (key && key !== 'confirm') {
            const answers = { ...(meta.answers ?? {}) };
            // Merge lists if the user sends multiple messages for same step
            if (answers[key]) {
              const prev = String(answers[key]);
              answers[key] = prev + '\n' + lastUserText;
            } else {
              answers[key] = lastUserText;
            }
            await persistMeta({ ...meta, answers });
          }
        } else {
          const saveKind = wantsSaveArtifact(lastUserText);
          if (saveKind || /\bsave\b/i.test(lastUserText)) {
            // Build a deterministic proposal to save the latest assistant draft
          let candidate = '';
          try {
            const history = await repo.listMessages(threadId!);
            const lastAssistant = [...history].reverse().find(m => m.role === 'assistant' && typeof m.content === 'string');
            candidate = (lastAssistant?.content ?? '').trim();
          } catch {}
          if (!candidate) {
            const prevAssistant = [...(parsed.data.messages as Array<{ role: string; content: string }>)].reverse().find(m => m.role === 'assistant');
            candidate = (prevAssistant?.content ?? '').trim();
          }
          if (candidate) {
            const kindFromMsg = saveKind ? findArtifactById(saveKind)?.id : null;
            const inferred = kindFromMsg ?? detectArtifactFromText(candidate) ?? findArtifactById(meta.phase)?.id ?? 'brief';
            const cfg = findArtifactById(inferred);
            const proposals = cfg ? [cfg.saveProposal(candidate)] : [];
            write({ type: 'data-finish', text: `Ready to save your ${cfg?.id ?? 'document'}.` });
            write({ type: 'data-proposals', proposals });
            controller.close();
            return;
          }
          }
        }

        const messagesWithMeta = [
          ...parsed.data.messages,
          { role: 'system', content: JSON.stringify({ threadMeta: meta }) },
        ] as Array<{ role: 'user'|'assistant'|'system'; content: string }>;
        let fullText = '';
        const result = await chatOrchestrate(id, messagesWithMeta, (delta: string) => {
          fullText += delta;
          write({ type: 'data-delta', delta });
        });
        const parsedOut = parseChatJson(result?.raw ?? '');
        let text: string = (parsedOut?.text ?? result?.raw ?? fullText);
        // persist assistant message (use parsed text if present, otherwise accumulated)
        await repo.addMessage(threadId!, 'assistant', text);
        // auto-title if thread has no title
        try {
          const t = await repo.getThread(threadId!);
          if (t && !t.title) {
            const titleSrc = (parsed.data.messages[parsed.data.messages.length - 2]?.content as string) || text;
            const title = deriveTitle(titleSrc);
            if (title) await repo.updateTitle(threadId!, title);
          }
        } catch {}
        // Gate proposals: only allow when the latest USER message explicitly asks
        // to create/update/generate/save or uses a slash command.
        const userMsgs = (parsed.data.messages as Array<{ role: string; content: string }>).filter(m => m.role === 'user');
        const lastUser = userMsgs[userMsgs.length - 1]?.content ?? '';
        const proposalsRaw = (parsedOut?.proposals as unknown[] | undefined) ?? [];
        const phaseActive = isPhase(meta.phase);
        const proposals = phaseActive
          ? (cmd === 'confirm' ? proposalsRaw : [])
          : (shouldAllowProposals(lastUser) ? proposalsRaw : []);
        // Gentle CTA: if the content looks like a Brief, suggest saving explicitly
        const detectedId = detectArtifactFromText(text);
        if (detectedId && proposals.length === 0) {
          const cfg = findArtifactById(detectedId);
          if (cfg?.cta) text = `${text}\n\n${cfg.cta}`;
        }
        write({ type: 'data-finish', text });
        write({ type: 'data-proposals', proposals });
        controller.close();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'stream_failed';
        write({ type: 'data-error', error: msg });
        controller.close();
      }
    }
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

async function prismaUserIdByEmail(email: string): Promise<{ id: number } | null> {
  const { prismaClient } = await import('@/src/backend/shared/infrastructure/prisma');
  return prismaClient.user.findUnique({ where: { email }, select: { id: true } });
}

function parseChatJson(text: string): { text?: string; proposals?: unknown[] } | null {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = match ? match[1] : text;
    try {
      return JSON.parse(raw);
    } catch {
      // Attempt to parse a trailing JSON object (unfenced)
      const tail = text.match(/\{[\s\S]*\}\s*$/);
      if (tail && tail[0]) {
        return JSON.parse(tail[0]);
      }
      throw new Error('no_json');
    }
  } catch { return null; }
}

function deriveTitle(s: string): string {
  const clean = (s ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const max = 50;
  const cut = clean.length > max ? clean.slice(0, max) + '…' : clean;
  return cut;
}

function shouldAllowProposals(userMsg: string): boolean {
  const msg = (userMsg || '').trim().toLowerCase();
  if (!msg) return false;
  // Slash commands explicitly allow proposals
  if (/^\/(brief|scope|epics|stories|roadmap|risks)\b/.test(msg)) return true;
  // Intent verbs + nouns indicating a request to change/generate artifacts
  const intentVerb = /(generate|create|update|save|add|plan)\b/;
  const artifact = /(brief|scope|epic|epics|story|stories|roadmap|risk|risks)\b/;
  return intentVerb.test(msg) && artifact.test(msg);
}


