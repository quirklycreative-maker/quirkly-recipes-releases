async function testSarvamAPI() {
  const apiKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';
  if (!apiKey) throw new Error('API key not set');

  const text = "This is a very long recipe text. ".repeat(40); // 1320 chars, definitely more than 3 chunks
  
  const allChunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 450) {
      allChunks.push(remaining);
      break;
    }
    let splitIndex = remaining.lastIndexOf('.', 450);
    if (splitIndex === -1) splitIndex = remaining.lastIndexOf('\n', 450);
    if (splitIndex === -1) splitIndex = remaining.lastIndexOf(' ', 450);
    if (splitIndex === -1) splitIndex = 450;
    
    allChunks.push(remaining.substring(0, splitIndex + 1));
    remaining = remaining.substring(splitIndex + 1).trim();
  }

  console.log(`Split text into ${allChunks.length} chunks.`);

  // Test first chunk
  const chunk = allChunks[0];
  console.log(`Sending single chunk to Sarvam API...`);

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey
    },
    body: JSON.stringify({
      inputs: [chunk],
      target_language_code: "en-IN",
      speaker: "priya",
      pace: 1.0,
      speech_sample_rate: 24000,
      enable_preprocessing: true,
      model: "bulbul:v3"
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sarvam API failed: ${response.status} ${response.statusText}. Body: ${errText}`);
  }

  const data = await response.json();
  console.log(`✅ Success! Received ${data.audios ? data.audios.length : 0} audios in response.`);
}

testSarvamAPI().catch(console.error);
