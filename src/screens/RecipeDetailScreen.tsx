// src/screens/RecipeDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/designTokens';
import { RecipeService, Recipe, YoutubeVideo } from '../services/recipeService';
import { NutritionInfoModal } from '../components/NutritionInfoModal';
import { VoiceService } from '../services/voiceService';
import { FirestoreService } from '../services/firestoreService';
import { auth } from '../firebaseConfig';

const recipeService = new RecipeService();
const voiceService = new VoiceService();
const firestoreService = new FirestoreService();

const RecipeDetailScreen: React.FC<any> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { recipeId, recipe: passedRecipe } = route?.params ?? {};
  const [recipe, setRecipe] = useState<Recipe | null>(passedRecipe || null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(passedRecipe || null);
  const [youtubeVideos, setYoutubeVideos] = useState<YoutubeVideo[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isHindi, setIsHindi] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => {
    if (!recipe && recipeId) {
      // Fallback if recipe wasn't passed directly
      const fetchRecipeDetails = async () => {
        // Find in MOCK_RECIPES directly to avoid pagination miss
        const { default: rawRecipes } = await import('../data/recipes.json');
        let found = rawRecipes.find((r: any) => r.id === recipeId);
        if (found) {
           const videos = await recipeService.getRecipeVideos(found.name);
           if (videos && videos.length > 0) found.videoUrl = videos[0].id;
           setRecipe(found as Recipe);
           setOriginalRecipe(found as Recipe);
           setYoutubeVideos(videos);
        }
      };
      fetchRecipeDetails();
    } else if (recipe) {
      recipeService.getRecipeVideos(recipe.name).then(setYoutubeVideos);
    }
  }, [recipeId, recipe]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Loading recipe details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLowGI = recipe.giLevel === 'low';

  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
    };
  }, []);

  const handleMadeThis = async () => {
    Alert.alert(
      "Confirm",
      "Did you make this recipe? We will remove used ingredients from your fridge and add them to your grocery requests.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, I made this!", 
          onPress: async () => {
            try {
              const currentFridge = await firestoreService.getFridgeItemsOnce();
              const userEmail = auth.currentUser?.email || 'user@quirkly.com';
              let count = 0;
              for (const recipeIngredient of recipe.ingredients) {
                // simple matching
                const fridgeMatch = currentFridge.find((f: any) => recipeIngredient.toLowerCase().includes(f.name.toLowerCase()));
                if (fridgeMatch) {
                  await firestoreService.deleteFridgeItem(fridgeMatch.id);
                  await firestoreService.addGroceryRequest(fridgeMatch.name, userEmail);
                  count++;
                }
              }
              Alert.alert("Awesome!", `Recipe cooked! Transferred ${count} ingredients from Fridge to Grocery Requests.`);
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          voiceService.stopSpeaking();
          navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Recipe Details</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.textButton, { marginRight: spacing.sm }]} 
            onPress={async () => {
              if (isTranslating) return;
              if (isHindi) {
                // Revert to English
                if (originalRecipe) setRecipe(originalRecipe);
                setIsHindi(false);
                return;
              }
              setIsTranslating(true);
              const translated = await recipeService.translateRecipe(recipe, 'Hindi');
              setRecipe(translated);
              setIsHindi(true);
              setIsTranslating(false);
            }}
          >
            {isTranslating ? <ActivityIndicator size="small" color={colors.accent} /> : 
              <Text style={styles.translateText}>{isHindi ? "ENG" : "िन्दी"}</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity 
            testID="speakerButton" style={styles.ttsButton} 
            onPress={() => {
              voiceService.speak(`Recipe for ${recipe.name}. Ingredients: ${recipe.ingredients.join(', ')}. Steps: ${recipe.steps.join('. ')}`, isHindi);
            }}
          >
            <Ionicons name="volume-high" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title & GI Section */}
        <View style={styles.heroSection}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <View style={styles.badgeRow}>
            <TouchableOpacity 
              style={styles.giBadgeContainer}
              onPress={() => setInfoModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[
                styles.idfCircle, 
                recipe.giLevel === 'unknown' ? styles.giUnknown : (
                  recipe.exactGI !== undefined 
                    ? (recipe.exactGI <= 55.9 ? styles.giLow : recipe.exactGI <= 69.9 ? styles.giMedium : styles.giHigh)
                    : (recipe.giLevel === 'low' ? styles.giLow : recipe.giLevel === 'medium' ? styles.giMedium : styles.giHigh)
                )
              ]} />
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            {recipe.tags.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hindi Video Tutorials Section */}
        {youtubeVideos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hindi Video Tutorials</Text>
            {youtubeVideos.map(video => (
              <TouchableOpacity 
                key={video.id} 
                style={styles.videoCard} 
                onPress={() => navigation.navigate('VideoPlayerScreen', { videoUrl: `https://www.youtube.com/watch?v=${video.id}` })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                  <Text style={styles.videoChannel}>{video.channel}</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration}</Text>
                  </View>
                </View>
                <View style={styles.miniPlayBtn}>
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}


        {/* Ingredients Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>
          <View style={styles.ingredientsCard}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} style={styles.checkIcon} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Steps</Text>
          {recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
        
        {/* I Made This Button */}
        <TouchableOpacity style={styles.madeThisButton} onPress={handleMadeThis}>
          <Ionicons name="restaurant-outline" size={20} color="#fff" />
          <Text style={styles.madeThisButtonText}>I Made This!</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Nutrition Info Modal */}
      <NutritionInfoModal 
        visible={infoModalVisible} 
        onClose={() => setInfoModalVisible(false)} 
        recipe={recipe} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ttsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButton: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  heroSection: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.md,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: spacing.md,
  },
  idfCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginRight: spacing.xs,
  },
  tagText: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 100,
    height: 70,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  videoChannel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.sm,
    marginTop: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  miniPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkIcon: {
    marginRight: spacing.sm,
  },
  ingredientText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  madeThisButton: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  madeThisButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginLeft: spacing.sm,
  }
});

export default RecipeDetailScreen;
