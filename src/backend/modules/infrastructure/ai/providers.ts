import { gateway } from '@ai-sdk/gateway';
import { extractReasoningMiddleware, wrapLanguageModel, type LanguageModel } from 'ai';

const THINKING_SUFFIX_REGEX = /-thinking$/;

export function getLanguageModel(modelId: string): LanguageModel {
  const isReasoningModel =
    modelId.includes('reasoning') || modelId.endsWith('-thinking');

  if (isReasoningModel) {
    const gatewayModelId = modelId.replace(THINKING_SUFFIX_REGEX, '');
    return wrapLanguageModel({
      model: gateway.languageModel(gatewayModelId),
      middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
    });
  }

  return gateway.languageModel(modelId);
}




