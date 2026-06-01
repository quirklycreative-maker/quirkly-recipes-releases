// src/screens/RecipeListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/designTokens';
import { RecipeService, Recipe } from '../services/recipeService';
import { NutritionInfoModal } from '../components/NutritionInfoModal';

const recipeService = new RecipeService();

const RecipeListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'quirkly' | 'youtube'>('youtube');
  const [youtubeResults, setYoutubeResults] = useState<Recipe[]>([]);
  const [searchingYouTube, setSearchingYouTube] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Modal state
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedRecipeForModal, setSelectedRecipeForModal] = useState<Recipe | any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchRecipes(1, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedTag, searchQuery]);

  // YouTube search fallback or explicit search
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || (activeTab === 'quirkly' && recipes.length > 0)) {
      setYoutubeResults([]);
      setSearchingYouTube(false);
      return;
    }

    setSearchingYouTube(true);
    const timer = setTimeout(async () => {
      const results = await recipeService.searchYouTubeRecipes(query, selectedTag);
      setYoutubeResults(results);
      setSearchingYouTube(false);
      
      // Kick off background processing for true exact ingredients & GL
      recipeService.processTranscriptsInBackground(results, (updatedRecipes) => {
        setYoutubeResults(updatedRecipes);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, recipes, activeTab]);

  const fetchIdRef = React.useRef(0);
  const fetchRecipes = async (pageNum: number = 1, isRefresh: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current;
    if (loadingMore && !isRefresh) return;
    setLoadingMore(true);
    const preferences = {
      vegetarian: selectedTag === 'veg',
      allowEgg: selectedTag === 'all' || selectedTag === 'egg',
      allowChicken: selectedTag === 'all' || selectedTag === 'chicken',
    };
    const suggestions = await recipeService.getSuggestions([], preferences, searchQuery, pageNum, 10);
    
    // Fix Race Condition: Only update state if this is the most recent fetch
    if (currentFetchId !== fetchIdRef.current) {
      return;
    }
    
    if (suggestions.length < 10) setHasMore(false);
    
    if (isRefresh) {
      setRecipes(suggestions);
    } else {
      setRecipes(prev => [...prev, ...suggestions]);
    }
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecipes(nextPage);
    }
  };

  const getGIStyle = (level: string) => {
    if (level === 'low') return styles.giLow;
    if (level === 'high') return styles.giHigh;
    if (level === 'unknown') return styles.giUnknown;
    return styles.giMedium;
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const isLowGI = item.giLevel === 'low';
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id, videoUrl: item.videoUrl, recipe: item })}
        activeOpacity={0.8}
      >
        {item.videoUrl && !item.videoUrl.includes('youtube.com') && (
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: `https://img.youtube.com/vi/${item.videoUrl}/hqdefault.jpg` }} style={styles.ytThumbnail} />
            <View style={styles.ytPlayOverlay}>
              <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        )}
        <View style={styles.cardHeader}>
          <Text style={styles.recipeName}>{item.name}</Text>
          <TouchableOpacity 
            style={styles.giBadgeContainer}
            onPress={() => {
              setSelectedRecipeForModal(item);
              setInfoModalVisible(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[
              styles.idfCircle, 
              item.exactGI !== undefined 
                ? (item.exactGI <= 55.9 ? styles.giLow : item.exactGI <= 69.9 ? styles.giMedium : styles.giHigh)
                : getGIStyle(item.giLevel)
            ]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.ingredientsSummary} numberOfLines={2}>
          Ingredients: {item.ingredients.join(', ')}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.tagsContainer}>
            {item.tags.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actionContainer}>
            <Text style={styles.actionText}>View Recipe</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getGLStyle = (gl: number) => {
    if (gl <= 10) return styles.giLow;
    if (gl <= 19) return styles.giMedium;
    return styles.giHigh;
  };

  const renderYouTubeItem = ({ item }: { item: Recipe }) => {
    if (!item.video) return null;
    return (
      <TouchableOpacity
        style={styles.ytCard}
        onPress={() => navigation.navigate('VideoPlayerScreen', { 
          videoUrl: `https://www.youtube.com/watch?v=${item.video.id}` 
        })}
        activeOpacity={0.8}
      >
        {/* Thumbnail */}
        <Image source={{ uri: item.video.thumbnail }} style={styles.ytThumbnail} />
        <View style={styles.ytPlayOverlay}>
          <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Video Info */}
        <View style={styles.ytInfo}>
          <View style={styles.ytTitleRow}>
            <Text style={styles.ytTitle} numberOfLines={2}>{item.video.title}</Text>
            
            {/* Show GL if available, otherwise fallback to GI */}
            <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 2 }}>
                {item.glycemicLoad !== undefined ? (item.isExact ? 'Exact GL' : 'Estimated GL') : 'Estimated GI'}
              </Text>
              {item.glycemicLoad !== undefined ? (
                <TouchableOpacity 
                  style={styles.giBadgeContainer}
                  onPress={() => {
                    setSelectedRecipeForModal(item);
                    setInfoModalVisible(true);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={[
                    styles.idfCircle, 
                    item.exactGI !== undefined 
                      ? (item.exactGI <= 55.9 ? styles.giLow : item.exactGI <= 69.9 ? styles.giMedium : styles.giHigh)
                      : getGIStyle(item.giLevel)
                  ]} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.giBadgeContainer}
                  onPress={() => {
                    setSelectedRecipeForModal(item);
                    setInfoModalVisible(true);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={[
                    styles.idfCircle, 
                    item.exactGI !== undefined 
                      ? (item.exactGI <= 55.9 ? styles.giLow : item.exactGI <= 69.9 ? styles.giMedium : styles.giHigh)
                      : getGIStyle(item.giLevel)
                  ]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.ytChannel}>{item.video.channel} • {item.video.duration}</Text>

          {/* Inferred Ingredients & Carbs */}
          <View style={styles.ytIngredientsRow}>
            <Ionicons name="nutrition-outline" size={14} color={colors.accent} />
            <Text style={styles.ytIngredients} numberOfLines={1}>
              {item.carbsGrams !== undefined ? `Carbs: ${item.carbsGrams}g | ` : ''}
              {item.ingredients.join(', ')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const showYouTubeFallback = activeTab === 'quirkly' && searchQuery.trim().length > 0 && recipes.length === 0;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quirkly Recipes</Text>
          <Text style={styles.subtitle}>Diabetes-friendly low-GI Indian meals</Text>
        </View>

        {/*
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'quirkly' && styles.tabButtonActive]}
            onPress={() => setActiveTab('quirkly')}
          >
            <Text style={[styles.tabText, activeTab === 'quirkly' && styles.tabTextActive]}>Our Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'youtube' && styles.tabButtonActive]}
            onPress={() => setActiveTab('youtube')}
          >
            <Text style={[styles.tabText, activeTab === 'youtube' && styles.tabTextActive]}>YouTube</Text>
          </TouchableOpacity>
        </View>
        */}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search recipes or ingredients..."
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tags */}
        <View style={styles.filterRow}>
          {(['all', 'veg', 'egg', 'chicken'] as const).map(tag => {
            const isActive = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                  {tag.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content Section */}
        {activeTab === 'youtube' ? (
          <View style={{ flex: 1 }}>
            {searchingYouTube ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Searching YouTube & computing GI...</Text>
              </View>
            ) : youtubeResults.length > 0 ? (
              <FlatList
                data={youtubeResults}
                keyExtractor={(item, index) => `yt-${item.video.id}-${index}`}
                renderItem={renderYouTubeItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Search for a recipe to find healthy YouTube videos</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {showYouTubeFallback ? (
              <View style={styles.ytSection}>
                <View style={styles.ytHeaderRow}>
                  <Ionicons name="logo-youtube" size={22} color="#FF0000" />
                  <Text style={styles.ytSectionTitle}>YouTube Results for "{searchQuery}"</Text>
                </View>
                <Text style={styles.ytSubtitle}>
                  Not in our database — here are YouTube videos with computed GI index
                </Text>
                {searchingYouTube ? (
                  <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: spacing.xl }} />
                ) : (
                  <FlatList
                    data={youtubeResults}
                    keyExtractor={(item) => item.video.id}
                    renderItem={renderYouTubeItem}
                    contentContainerStyle={styles.listContainer}
                  />
                )}
              </View>
            ) : (
              <FlatList
                data={recipes}
                keyExtractor={(item) => item.id}
                renderItem={renderRecipeItem}
                contentContainerStyle={styles.listContainer}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.accent} style={{ margin: spacing.md }} /> : null}
                ListEmptyComponent={
                  !loadingMore ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No recipes match your filter.</Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        )}
      </View>
      <NutritionInfoModal 
        visible={infoModalVisible} 
        onClose={() => setInfoModalVisible(false)} 
        recipe={selectedRecipeForModal} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginTop: spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter',
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: spacing.sm,
    marginHorizontal: 3,
    borderRadius: radii.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    flex: 1,
    marginRight: spacing.sm,
  },
  giBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idfCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#00AEEF',
  },
  giLow: {
    backgroundColor: '#2ecc71',
  },
  giMedium: {
    backgroundColor: '#f1c40f',
  },
  giHigh: {
    backgroundColor: '#e74c3c',
  },
  giUnknown: {
    backgroundColor: '#95a5a6',
  },
  giText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  ingredientsSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginRight: spacing.xs,
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontFamily: 'Inter',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    fontFamily: 'Inter',
    marginRight: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 16,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  // --- YouTube Fallback Styles ---
  ytSection: {
    flex: 1,
  },
  ytHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ytSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginLeft: spacing.sm,
    flex: 1,
  },
  ytSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  ytCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  ytThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  ytPlayOverlay: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ytInfo: {
    padding: spacing.md,
  },
  ytTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ytTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 20,
  },
  ytChannel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginBottom: spacing.sm,
  },
  ytIngredientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  ytIngredients: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginLeft: 6,
    flex: 1,
  },
});

export default RecipeListScreen;
