// src/screens/LiveVideoScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAppFonts } from '../hooks/useAppFonts';
import { RecipeService, YoutubeVideo } from '../services/recipeService';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type ParamList = {
  LiveVideo: { recipeId: string };
};

type LiveVideoRouteProp = RouteProp<ParamList, 'LiveVideo'>;

export const LiveVideoScreen: React.FC = () => {
  const [fontsLoaded] = useAppFonts();
  const navigation = useNavigation();
  const route = useRoute<LiveVideoRouteProp>();
  const { recipeId } = route.params;

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);

  useEffect(() => {
    const fetchLive = async () => {
      const service = new RecipeService();
      const all = await service.getSuggestions([], { vegetarian: false, allowEgg: true, allowChicken: true });
      const recipe = all.find(r => r.id === recipeId);
      const name = recipe?.name ?? '';
      const live = await service.searchLiveVideos(name);
      setVideos(live);
      setLoading(false);
    };
    fetchLive();
  }, [recipeId]);

  if (!fontsLoaded) return null;
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7e5f" />
        <Text style={styles.loading}>Fetching live streams…</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No live streams found for this recipe.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: YoutubeVideo }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <YoutubePlayer height={200} play={false} videoId={item.id} />
    </View>
  );

  return (
    <FlatList
      data={videos}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001f3f',
  },
  loading: {
    marginTop: 12,
    color: '#fff',
    fontFamily: 'Inter',
  },
  empty: {
    color: '#fff',
    fontFamily: 'Inter',
    fontSize: 16,
  },
  list: {
    padding: 12,
    backgroundColor: '#001f3f',
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#013a63',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    color: '#ff7e5f',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
});
