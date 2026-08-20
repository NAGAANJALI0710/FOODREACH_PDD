import { execFile } from 'child_process';
import path from 'path';

export interface IntentPredictionResult {
  intent: string;
  confidence: number;
}

export class IntentService {
  private static pythonScriptPath = path.join(__dirname, '..', 'ai', 'predict_intent.py');

  /**
   * Preprocess user input text: lowercase, remove punctuation, normalize spaces
   */
  public static preprocessText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    let clean = text.toLowerCase();
    clean = clean.replace(/[^\w\s]/g, '');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
  }

  /**
   * Predict intent using the custom trained Machine Learning model (.pkl)
   */
  public static async predictIntent(userMessage: string): Promise<IntentPredictionResult> {
    const cleanText = this.preprocessText(userMessage);

    if (!cleanText) {
      return { intent: 'unknown', confidence: 0.0 };
    }

    return new Promise<IntentPredictionResult>((resolve) => {
      execFile('python', [this.pythonScriptPath, userMessage], { timeout: 5000 }, (error, stdout, stderr) => {
        if (error || !stdout) {
          console.warn('[IntentService] Python prediction failed fallback:', error?.message || stderr);
          return resolve({ intent: 'unknown', confidence: 0.0 });
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve({
            intent: parsed.intent || 'unknown',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.0
          });
        } catch (err) {
          console.error('[IntentService] Failed to parse model prediction JSON:', err);
          resolve({ intent: 'unknown', confidence: 0.0 });
        }
      });
    });
  }
}
