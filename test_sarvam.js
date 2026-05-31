import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY;

async function test() {
  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey
    },
    body: JSON.stringify({
      inputs: ["Hello, this is a test audio generation. 1 2 3."],
      target_language_code: "en-IN",
      speaker: "priya",
      pace: 1.0,
      speech_sample_rate: 24000,
      enable_preprocessing: true,
      model: "bulbul:v3"
    })
  });
  
  if (!response.ok) {
    console.error("Failed:", await response.text());
    return;
  }
  
  const data = await response.json();
  if (data && data.audios && data.audios.length > 0) {
    const base64Audio = data.audios[0];
    fs.writeFileSync('test.wav', Buffer.from(base64Audio, 'base64'));
    console.log("Written test.wav");
  }
}

test();
