import { loadTemplate } from './loader';

function render(template: string, vars: Record<string, string | undefined | null>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const safe = (value ?? '').toString();
    const re = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g');
    out = out.replace(re, safe);
  }
  // Remove any unreplaced placeholders
  out = out.replace(/{{\s*[\w.-]+\s*}}/g, '');
  return out;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function buildPromptFromTemplate(templatePath: string, vars: Record<string, string | undefined | null>) {
  const tpl = await loadTemplate(templatePath);
  return render(tpl.template, vars);
}


