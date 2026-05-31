// src/services/voiceService.ts
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

export interface VoiceResult {
  transcript: string;
  language: 'hi' | 'ne'; // Hindi or Nepali
}

export class VoiceService {
  private player: AudioPlayer | null = null;
  private isSpeaking: boolean = false;

  async startListening(): Promise<VoiceResult> {
    // STT stub
    return { transcript: '', language: 'hi' };
  }

  // Helper function to generate a simple hash for caching
  private getCacheFileName(text: string, isHindi: boolean): string {
    let hash = 0;
    const str = text + isHindi;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `sarvam_cache_${Math.abs(hash).toString(16)}.wav`;
  }

  async speak(text: string, isHindi: boolean = false): Promise<void> {
    const apiKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';
    if (!apiKey) {
      console.warn('SARVAM API key not found. Please add EXPO_PUBLIC_SARVAM_API_KEY to your .env');
      return;
    }

    try {
      this.isSpeaking = true;
      if (this.player) {
        this.player.pause();
        this.player.remove();
        this.player = null;
      }

      // 1. Chunk the ENTIRE text into pieces <= 450 chars
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

      await setAudioModeAsync({ 
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: false
      });

      // Helper function to fetch a specific chunk (max 450 chars)
      const fetchChunk = async (chunkIndex: number) => {
        const chunk = allChunks[chunkIndex];
        if (!chunk) return null;

        const cacheFileName = this.getCacheFileName(chunk, isHindi);
        const fileUri = (FileSystem.documentDirectory || '') + cacheFileName;

        // Check if we already have this chunk cached!
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          return { cachedUri: fileUri };
        }

        // If not cached, hit the API
        const response = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": apiKey
          },
          body: JSON.stringify({
            inputs: [chunk],
            target_language_code: isHindi ? "hi-IN" : "en-IN",
            speaker: "priya",
            pace: 1.0,
            speech_sample_rate: 24000,
            enable_preprocessing: true,
            model: "bulbul:v3"
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Sarvam API failed for chunk ${chunkIndex}: ${response.statusText}. Body: ${errText}`);
          return null;
        }
        
        const data = await response.json();
        if (data && data.audios && data.audios.length > 0) {
           const base64Audio = data.audios[0];
           await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
             encoding: FileSystem.EncodingType.Base64,
           });
           return { cachedUri: fileUri };
        }

        return null;
      };

      let currentChunkIndex = 0;
      // Start fetching the first chunk immediately
      let nextChunkPromise: Promise<any> | null = fetchChunk(0);

      while (nextChunkPromise && this.isSpeaking) {
        // Wait for the currently fetching chunk to complete
        const result = await nextChunkPromise;
        currentChunkIndex++;
        
        // Kick off the NEXT chunk fetch in the background immediately!
        nextChunkPromise = fetchChunk(currentChunkIndex);
        
        if (result && result.cachedUri) {
          if (!this.isSpeaking) break;

          await new Promise<void>((resolve) => {
            if (this.player) {
              this.player.remove();
            }
            // Ensure fileUri has file:// prefix for iOS AVPlayer
            let finalUri = result.cachedUri;
            if (!finalUri.startsWith('file://')) {
              finalUri = 'file://' + finalUri;
            }
            this.player = createAudioPlayer(finalUri);
            this.player.volume = 1.0;
            
            let hasCalledPlay = false;

            // Wait for native completion event
            const subscription = this.player!.addListener('playbackStatusUpdate', (status: any) => {
              if (!hasCalledPlay && status.isLoaded) {
                hasCalledPlay = true;
                this.player!.play();
              }
              
              if (status.didJustFinish || !this.isSpeaking || status.error) {
                if (status.error) {
                  console.error("AudioPlayer error:", status.error);
                }
                subscription.remove();
                resolve();
              }
            });
          });
        }
      }
    } catch (e) {
      console.error("Error generating speech with Sarvam:", e);
    } finally {
      this.isSpeaking = false;
    }
  }

  async stopSpeaking(): Promise<void> {
    this.isSpeaking = false;
    if (this.player) {
      this.player.pause();
      this.player.remove();
      this.player = null;
    }
  }
}
