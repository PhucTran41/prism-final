import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const PROMPTS_ROOT = path.join(process.cwd(), 'src', 'backend', 'ai', 'prompts');

export async function loadYaml(relativePath: string): Promise<any> {
  const filePath = path.join(PROMPTS_ROOT, relativePath);
  const content = await fs.readFile(filePath, 'utf8');
  return yaml.load(content);
}

export async function loadTemplate(templateName: string): Promise<{ name?: string; version?: number; template: string }> {
  // templateName can be like 'templates/brief.yml'
  const doc = await loadYaml(templateName);
  if (!doc || typeof (doc as any).template !== 'string') {
    throw new Error(`Invalid template YAML: ${templateName}`);
  }
  return doc as any;
}


