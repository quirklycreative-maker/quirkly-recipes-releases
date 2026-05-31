import { fetch } from 'cross-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';
  if (!apiKey) throw new Error("No API key");
  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey
    },
    body: JSON.stringify({
      inputs: ["Hello world"],
      target_language_code: "en-IN",
      speaker: "priya",
      pace: 1.0,
      speech_sample_rate: 24000,
      enable_preprocessing: true,
      model: "bulbul:v3"
    })
  });
  const data = await response.json();
  const audio = data.audios[0];
  console.log("Audio starts with:", audio.substring(0, 50));
}
test();
