import { YoutubeTranscript } from 'youtube-transcript';

export class YouTubeTranscriptService {
  /**
   * Fetches the full transcript for a given YouTube video ID.
   * Returns a single concatenated string of the spoken text.
   * If the video has no transcript or an error occurs, it returns null.
   */
  static async fetchTranscriptText(videoId: string): Promise<string | null> {
    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      if (!transcriptData || transcriptData.length === 0) {
        return null;
      }
      
      // Concatenate all text segments
      const fullText = transcriptData.map(item => item.text).join(' ');
      return fullText;
    } catch (e) {
      console.warn(`Could not fetch transcript for video ${videoId}:`, e);
      return null;
    }
  }
}
