import { AppConfig } from '@/config/AppConfig';
import { generateText } from 'ai';
import { getLanguageModel } from './providers';

export type AiChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

export type AiGenerateParams = {
  model?: string;
  prompt: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  topP?: number;
};

export type AiChatParams = {
  model?: string;
  messages: AiChatMessage[];
  baseUrl?: string;
  apiKey?: string;
};

export type AiResponse = {
  text: string;
  raw?: unknown;
};

export class AiSdkService {
  private readonly fallbackModel?: string;

  constructor() {
    this.fallbackModel = undefined; // require caller to provide model for flexibility
  }

  async generateText(params: AiGenerateParams): Promise<AiResponse> {
    const modelId = params.model || this.fallbackModel;
    if (!modelId) {
      throw new Error('model is required');
    }
    const { text, response } = await generateText({
      model: getLanguageModel(modelId),
      prompt: params.prompt,
      temperature: params.temperature,
      topP: params.topP,
    });
    return { text, raw: response };
  }

  async chat(params: AiChatParams): Promise<AiResponse> {
    const modelId = params.model || this.fallbackModel;
    if (!modelId) {
      throw new Error('model is required');
    }
    const prompt = params.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const { text, response } = await generateText({
      model: getLanguageModel(modelId),
      prompt,
    });
    return { text, raw: response };
  }
}


