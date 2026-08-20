import { IntentService, IntentPredictionResult } from './intentService';
import { ResponseGenerator } from './responseGenerator';

export interface ChatbotEngineResult {
  reply: string;
  intent: string;
  confidence: number;
}

export class ChatbotEngine {
  /**
   * Process incoming user message using the custom NLP intent model and Knowledge Base
   */
  public static async processMessage(userMessage: string): Promise<ChatbotEngineResult> {
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return {
        reply: ResponseGenerator.generateResponse('', 'unknown', 0.0),
        intent: 'unknown',
        confidence: 0.0
      };
    }

    // Step 1: Predict intent and confidence from custom trained .pkl model
    const prediction: IntentPredictionResult = await IntentService.predictIntent(userMessage);

    // Step 2: Generate corresponding response from knowledge base
    const reply: string = ResponseGenerator.generateResponse(userMessage, prediction.intent, prediction.confidence);

    return {
      reply,
      intent: prediction.intent,
      confidence: prediction.confidence
    };
  }
}
