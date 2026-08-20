import { ResponseGenerator } from '../services/responseGenerator';
import path from 'path';
import fs from 'fs';

const kbPath = path.join(__dirname, '..', 'ai', 'knowledgeBase.json');
const raw = fs.readFileSync(kbPath, 'utf-8');
const kb = JSON.parse(raw);

console.log("Loaded KB keys:", Object.keys(kb));
const faqs = kb["food_donation"].faqs;
console.log("Number of FAQs in food_donation:", faqs.length);

const query = "what is the process for food donation?";
console.log(`\nDebugging query: "${query}"`);

for (const faq of faqs) {
  console.log(`\nFAQ Question: "${faq.question}"`);
  console.log(`Similarity to Question: ${(ResponseGenerator as any).calculateSimilarity(query, faq.question)}`);
  
  if (faq.patterns) {
    for (const pattern of faq.patterns) {
      const sim = (ResponseGenerator as any).calculateSimilarity(query, pattern);
      console.log(`  - Pattern: "${pattern}" -> Similarity: ${sim}`);
    }
  }
}

const reply = ResponseGenerator.generateResponse(query, 'food_donation', 1.0);
console.log(`\nGenerated Response: "${reply}"`);
