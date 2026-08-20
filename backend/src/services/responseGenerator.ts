import path from 'path';
import fs from 'fs';

interface FAQItem {
  question: string;
  patterns: string[];
  answer: string;
}

interface IntentData {
  category: string;
  faqs: FAQItem[];
}

interface MatchResult {
  faq: FAQItem;
  similarity: number;
  intentKey: string;
}

export class ResponseGenerator {
  private static knowledgeBase: Record<string, IntentData> | null = null;
  private static kbPath = path.join(__dirname, '..', 'ai', 'knowledgeBase.json');

  private static fallbackResponse = "I can help with FoodReach-related questions such as food donations, NGOs, volunteers, food safety, and app usage. Could you please rephrase your question?";

  /**
   * Load knowledge base JSON into memory
   */
  private static loadKnowledgeBase(): Record<string, IntentData> {
    if (this.knowledgeBase) {
      return this.knowledgeBase;
    }

    try {
      if (fs.existsSync(this.kbPath)) {
        const raw = fs.readFileSync(this.kbPath, 'utf-8');
        this.knowledgeBase = JSON.parse(raw);
      } else {
        console.error('[ResponseGenerator] knowledgeBase.json not found at', this.kbPath);
        this.knowledgeBase = {};
      }
    } catch (err) {
      console.error('[ResponseGenerator] Error loading knowledgeBase.json:', err);
      this.knowledgeBase = {};
    }

    return this.knowledgeBase || {};
  }

  /**
   * Helper functions for similarity matching
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  private static jaccardSimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    if (set1.size === 0 || set2.size === 0) return 0;
    
    let intersection = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        intersection++;
      }
    }
    const union = set1.size + set2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  private static getCharNGrams(text: string, n = 3): Set<string> {
    const clean = text.toLowerCase().replace(/[^\w]/g, '');
    const nGrams = new Set<string>();
    for (let i = 0; i <= clean.length - n; i++) {
      nGrams.add(clean.substring(i, i + n));
    }
    return nGrams;
  }

  private static charNGramSimilarity(text1: string, text2: string, n = 3): number {
    const nGrams1 = this.getCharNGrams(text1, n);
    const nGrams2 = this.getCharNGrams(text2, n);
    if (nGrams1.size === 0 || nGrams2.size === 0) return 0;
    
    let intersection = 0;
    for (const gram of nGrams1) {
      if (nGrams2.has(gram)) {
        intersection++;
      }
    }
    const union = nGrams1.size + nGrams2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  private static calculateSimilarity(userQuery: string, pattern: string): number {
    const q1 = userQuery.toLowerCase().trim();
    const q2 = pattern.toLowerCase().trim();

    if (q1 === q2) return 1.0;

    // Direct containment checks
    if (q1.length > 5 && q2.length > 5) {
      if (q1.includes(q2) || q2.includes(q1)) {
        return 0.85;
      }
    }

    const tokens1 = this.tokenize(q1);
    const tokens2 = this.tokenize(q2);

    const wordJaccard = this.jaccardSimilarity(tokens1, tokens2);
    const charJaccard = this.charNGramSimilarity(q1, q2, 3);

    return wordJaccard * 0.5 + charJaccard * 0.5;
  }

  /**
   * Generate response given user query, predicted intent, and confidence score
   */
  public static generateResponse(userQuery: string, intent = 'unknown', confidence = 0.0): string {
    const kb = this.loadKnowledgeBase();

    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
      return this.fallbackResponse;
    }

    // Define thresholds
    const INTENT_THRESHOLD = 0.35;
    const SIMILARITY_THRESHOLD = 0.50;

    let bestMatch: MatchResult | null = null;

    // Helper to scan a specific intent
    const scanIntent = (intentKey: string) => {
      const intentData = kb[intentKey];
      if (!intentData || !intentData.faqs || !Array.isArray(intentData.faqs)) return;

      for (const faq of intentData.faqs) {
        // Compare with canonical question
        let maxSim = this.calculateSimilarity(userQuery, faq.question);

        // Compare with all patterns/examples
        if (faq.patterns && Array.isArray(faq.patterns)) {
          for (const pattern of faq.patterns) {
            const sim = this.calculateSimilarity(userQuery, pattern);
            if (sim > maxSim) maxSim = sim;
          }
        }

        if (!bestMatch || maxSim > (bestMatch as MatchResult).similarity) {
          bestMatch = { faq, similarity: maxSim, intentKey };
        }
      }
    };

    const scannedIntents = new Set<string>();

    // 1. Try matching within the predicted intent first if it is confident
    if (intent && intent !== 'unknown' && confidence >= INTENT_THRESHOLD) {
      scanIntent(intent);
      scannedIntents.add(intent);
    }

    // 2. If no match found or best match is below high confidence (0.85), scan ALL intents for a better match
    if (!bestMatch || (bestMatch as MatchResult).similarity < 0.85) {
      for (const key of Object.keys(kb)) {
        if (!scannedIntents.has(key)) {
          scanIntent(key);
          scannedIntents.add(key);
        }
      }
    }

    // 3. Return the match if it exceeds the similarity threshold
    if (bestMatch && (bestMatch as MatchResult).similarity >= SIMILARITY_THRESHOLD) {
      console.info(`[ResponseGenerator] Matched question "${(bestMatch as MatchResult).faq.question}" in intent "${(bestMatch as MatchResult).intentKey}" with similarity ${(bestMatch as MatchResult).similarity.toFixed(2)}`);
      return (bestMatch as MatchResult).faq.answer;
    }

    // 4. Fallback if no question matched confidently
    console.info(`[ResponseGenerator] No confident match for query: "${userQuery}". Best similarity was: ${bestMatch ? (bestMatch as MatchResult).similarity.toFixed(2) : 0.0}`);
    return this.fallbackResponse;
  }
}
