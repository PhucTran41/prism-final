export type ArtifactId = 'brief' | 'scope' | 'risks';

export type ArtifactConfig = {
  id: ArtifactId;
  // Detect if a block of Markdown likely represents this artifact
  detect: (text: string) => boolean;
  // Build a deterministic save proposal from raw Markdown text
  saveProposal: (contentMd: string) => { kind: `${ArtifactId}.update`; payload: { contentMd: string } };
  // Human CTA label appended to assistant messages when detection fires
  cta: string;
  // Optional mapping to a chat phase identifier
  phase?: ArtifactId;
};

const has = (re: RegExp, s: string) => re.test(s);

export const ARTIFACTS: readonly ArtifactConfig[] = [
  {
    id: 'brief',
    detect: (s: string) => {
      // Look for canonical sections
      return (
        has(/(^|\n)\s*problem\s*:/i, s) &&
        has(/(^|\n)\s*users?\s*:/i, s) &&
        has(/(^|\n)\s*goals?\s*:/i, s) &&
        has(/(^|\n)\s*constraints?\s*:/i, s) &&
        s.length > 120
      );
    },
    saveProposal: (contentMd: string) => ({ kind: 'brief.update', payload: { contentMd } }),
    cta: 'To save this brief, type "save brief".',
    phase: 'brief',
  },
  {
    id: 'scope',
    detect: (s: string) => {
      // MoSCoW sections (allow some variants)
      const must = has(/(^|\n)\s*(must[-\s]?haves?|must)\s*:/i, s);
      const should = has(/(^|\n)\s*(should[-\s]?haves?|should)\s*:/i, s);
      const could = has(/(^|\n)\s*(could[-\s]?haves?|could)\s*:/i, s);
      const nonGoals = has(/(^|\n)\s*(non[-\s]?goals?|out\s*of\s*scope)\s*:/i, s);
      return must && should && could && nonGoals;
    },
    saveProposal: (contentMd: string) => ({ kind: 'scope.update', payload: { contentMd } }),
    cta: 'To save this scope, type "save scope".',
    phase: 'scope',
  },
  {
    id: 'risks',
    detect: (s: string) => {
      const assumptions = has(/(^|\n)\s*assumptions?\s*:/i, s);
      const risks = has(/(^|\n)\s*risks?\s*:/i, s);
      const mitigations = has(/(^|\n)\s*mitigations?\s*:/i, s);
      return (assumptions && risks) || (risks && mitigations);
    },
    saveProposal: (contentMd: string) => ({ kind: 'risks.update', payload: { contentMd } }),
    cta: 'To save these assumptions & risks, type "save risks".',
    phase: 'risks',
  },
] as const;

export function findArtifactById(id: string | null | undefined): ArtifactConfig | null {
  if (!id) return null;
  const norm = id.toLowerCase().replace(/s$/, '') as ArtifactId;
  return (ARTIFACTS as ArtifactConfig[]).find(a => a.id === norm) ?? null;
}


