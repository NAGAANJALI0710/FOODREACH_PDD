import { ChatbotEngine } from '../services/chatbotEngine';

const testQuestions = [
  // Required minimum questions
  "What food are accepted?",
  "What foods can I donate?",
  "Can I donate cooked food?",
  "Can I donate vegetables?",
  "Can I donate fruits?",
  "Can I donate expired food?",
  "How do I donate food?",
  "How do NGOs work?",
  "How can an NGO register?",
  "How can I become a volunteer?",
  "How do I track my donation?",
  "What happens after my donation is accepted?",
  "How do I update my profile?",
  "How do I change my password?",

  // Paraphrased variations
  "what is the process for food donation?",
  "can we give warm cooked food?",
  "are stale items accepted?",
  "how to register ngo",
  "what happens once my donation is claimed?",
  "how do I edit contact details?",

  // Out of scope
  "What is the capital of France?",
  "Who won the world cup in 2022?"
];

async function runTests() {
  console.log("=================================================");
  console.log("          FoodReach Chatbot Engine Tests          ");
  console.log("=================================================\n");

  for (const query of testQuestions) {
    console.log(`User Query: "${query}"`);
    const result = await ChatbotEngine.processMessage(query);
    console.log(`Predicted Intent: ${result.intent} (conf: ${result.confidence})`);
    console.log(`Chatbot Reply: "${result.reply}"`);
    console.log("-------------------------------------------------\n");
  }

  // Same Question 5 Times Test
  console.log("=================================================");
  console.log("          Repeated Question Consistency Test      ");
  console.log("=================================================");
  const repeatedQuery = "What food are accepted?";
  console.log(`Asking "${repeatedQuery}" 5 times:`);
  
  const replies = new Set<string>();
  for (let i = 1; i <= 5; i++) {
    const res = await ChatbotEngine.processMessage(repeatedQuery);
    console.log(`Try #${i} Reply: "${res.reply}"`);
    replies.add(res.reply);
  }

  console.log(`Unique replies returned: ${replies.size}`);
  if (replies.size === 1) {
    console.log("✅ SUCCESS: Chatbot returned the exact same answer every time! Random response selection has been successfully removed.\n");
  } else {
    console.error("❌ FAILURE: Chatbot returned different/random answers!");
  }
}

runTests().catch(err => {
  console.error("Chatbot test script failed:", err);
});
