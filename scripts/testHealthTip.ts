import { config } from 'dotenv';
config();
const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: "Say hello" }],
    max_tokens: 100
  })
}).then(r => r.json()).then(console.log).catch(console.error);

