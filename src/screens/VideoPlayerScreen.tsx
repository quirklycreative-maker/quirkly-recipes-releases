// src/screens/VideoPlayerScreen.tsx
// Screen that plays a YouTube video using react-native-youtube-iframe.
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/designTokens';
import { RecipeService } from '../services/recipeService';

interface Props {
  route?: any;
  videoUrl?: string;
}

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - just a bare VIDEO_ID string
 */
function extractVideoId(url: string): string {
  if (!url) return '';
  // watch?v= format
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  if (watchMatch) return watchMatch[1];
  // embed/ format
  const embedMatch = url.match(/\/embed\/([^?&#]+)/);
  if (embedMatch) return embedMatch[1];
  // youtu.be/ short format
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch) return shortMatch[1];
  // If it's already just an ID (no slashes, no dots)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return url;
}

export const VideoPlayerScreen: React.FC<Props> = ({ route, videoUrl: directVideoUrl }) => {
  const navigation = useNavigation();
  const videoUrl = route?.params?.videoUrl || directVideoUrl || '';
  const videoId = extractVideoId(videoUrl);
  const [playing, setPlaying] = useState(true);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const [transcript, setTranscript] = useState<string | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  useEffect(() => {
    if (videoId) {
      setLoadingTranscript(true);
      new RecipeService().getVideoTranscript(videoId)
        .then(setTranscript)
        .finally(() => setLoadingTranscript(false));
    }
  }, [videoId]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Watch Video</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.playerWrapper}>
        {videoId ? (
          <YoutubePlayer
            height={playerHeight}
            play={false}
            videoId={videoId}
            onChangeState={onStateChange}
            initialPlayerParams={{
              preventFullScreen: false,
              modestbranding: 1,
              rel: 0,
            }}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.errorText}>No video available</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.transcriptContainer} contentContainerStyle={styles.transcriptContent}>
        <Text style={styles.transcriptTitle}>Video Transcript</Text>
        {loadingTranscript ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
        ) : transcript ? (
          <Text style={styles.transcriptText}>{transcript}</Text>
        ) : (
          <Text style={styles.errorText}>No transcript available for this video.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const playerHeight = Math.round(width * 9 / 16); // 16:9 aspect ratio

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f3f',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 40,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  playerWrapper: {
    width: '95%',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  errorContainer: {
    height: playerHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 16,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  transcriptContainer: {
    flex: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  transcriptContent: {
    paddingBottom: spacing.xl,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.sm,
  },
  transcriptText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
});

export default VideoPlayerScreen;
