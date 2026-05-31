// src/screens/InventoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ScrollView,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/designTokens';
import { auth } from '../firebaseConfig';
import { GroceryParser } from '../services/groceryParser';
import { FirestoreService, FridgeItem, GroceryRequest } from '../services/firestoreService';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

const parser = new GroceryParser();
const firestoreService = new FirestoreService();



// Dictionary to map Hindi ingredient names to English ones used in recipes
const INGREDIENT_MAP: { [key: string]: string } = {
  palak: 'Spinach',
  paneer: 'Paneer (Cottage Cheese)',
  chicken: 'Chicken',
  methi: 'Fenugreek Leaves (Methi)',
  anda: 'Eggs',
  egg: 'Eggs',
  eggs: 'Eggs',
  tamatar: 'Tomato',
  tomato: 'Tomato',
  pyaz: 'Onion',
  onion: 'Onion',
  dahi: 'Yogurt',
  yogurt: 'Yogurt',
  dal: 'Moong Dal (Yellow Lentils)',
  adrak: 'Ginger',
  ginger: 'Ginger',
  lasun: 'Garlic',
  garlic: 'Garlic',
};

const InventoryScreen: React.FC = () => {
  // Current user role
  const userEmail = auth.currentUser?.email || 'helper@quirkly.com';
  const isOwner = userEmail.toLowerCase().includes('owner');

  // State
  const [activeTab, setActiveTab] = useState<'fridge' | 'grocery'>('fridge');
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [groceryRequests, setGroceryRequests] = useState<GroceryRequest[]>([]);
  const [inputText, setInputText] = useState('');
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeFridge = firestoreService.listenToFridge((items) => {
      setFridgeItems(items);
    });

    const unsubscribeRequests = firestoreService.listenToGroceryRequests((requests) => {
      setGroceryRequests(requests);
    });

    return () => {
      unsubscribeFridge();
      unsubscribeRequests();
    };
  }, []);

  const handleAddItem = async (name: string, isRequest = false) => {
    if (!name.trim()) return;
    
    // Check if ingredient matches map
    const mappedName = INGREDIENT_MAP[name.trim().toLowerCase()] || name.trim();

    if (isRequest) {
      // Check if already in request list
      if (groceryRequests.some(item => item.name.toLowerCase() === mappedName.toLowerCase())) {
        return;
      }
      await firestoreService.addGroceryRequest(mappedName, userEmail);
    } else {
      // Check if already in fridge
      if (fridgeItems.some(item => item.name.toLowerCase() === mappedName.toLowerCase())) {
        return;
      }
      await firestoreService.addFridgeItem(mappedName, '1 unit');
    }
  };

  const handleDeleteFridgeItem = async (id: string) => {
    await firestoreService.deleteFridgeItem(id);
  };

  const handleDeleteRequest = async (id: string) => {
    await firestoreService.deleteGroceryRequest(id);
  };

  const handleApproveRequest = async (request: GroceryRequest) => {
    await firestoreService.approveGroceryRequest(request);
    Alert.alert('Approved', `"${request.name}" has been approved and moved to the Fridge.`);
  };

  const processVoiceText = (text: string) => {
    const result = parser.parse(text);
    
    // Parse keywords
    const foundIngredients: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Look for matched ingredients in preset dictionary
    Object.keys(INGREDIENT_MAP).forEach(key => {
      if (text.toLowerCase().includes(key)) {
        foundIngredients.push(INGREDIENT_MAP[key]);
      }
    });

    if (foundIngredients.length === 0) {
      // Fallback to naive parser words
      result.ingredients.forEach(w => {
        if (w.length > 3) foundIngredients.push(w);
      });
    }

    if (foundIngredients.length === 0) {
      Alert.alert('Voice Parser', `I heard: "${text}"\n\nNo ingredients detected. Try phrases with: palak, paneer, chicken, anda, tamatar, pyaz, dahi.`);
      return;
    }

    const isGroceryRequest = result.requestGrocery || text.toLowerCase().includes('order') || text.toLowerCase().includes('khareed');

    foundIngredients.forEach(ing => {
      handleAddItem(ing, isGroceryRequest);
    });

    Alert.alert(
      'Voice Success',
      `Recognized: "${text}"\n\nDetected Ingredients: ${foundIngredients.join(', ')}\nAction: ${isGroceryRequest ? 'Added to Grocery Requests' : 'Added directly to Fridge'}`
    );
  };

  const handleStartRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Microphone permission is required to use voice input.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (e) {
      console.error("Error starting recording:", e);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessingVoice(true);
      setVoiceModalVisible(true);
      
      await recorder.stop();
      const uri = recorder.uri;
      
      if (uri) {
        const apiKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: 'recording.wav',
          type: 'audio/wav',
        } as any);
        formData.append('model', 'saaras:v1');
        
        const response = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
          method: 'POST',
          headers: {
            'api-subscription-key': apiKey,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });
        
        if (!response.ok) {
           throw new Error(await response.text());
        }
        
        const data = await response.json();
        const text = data.transcript || '';
        processVoiceText(text);
      }
    } catch (e: any) {
      console.error("Transcription error:", e);
      Alert.alert('Transcribe Error', e.message || 'Failed to transcribe audio.');
    } finally {
      setIsProcessingVoice(false);
      setVoiceModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>Quirkly Inventory</Text>
        <View style={styles.roleContainer}>
          <Ionicons name="person-circle" size={16} color={colors.accent} />
          <Text style={styles.roleText}>Logged in as: {isOwner ? 'Owner' : 'Helper'}</Text>
        </View>
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'fridge' && styles.tabButtonActive]}
          onPress={() => setActiveTab('fridge')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'fridge' && styles.tabButtonTextActive]}>
            FRIDGE STOCK ({fridgeItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'grocery' && styles.tabButtonActive]}
          onPress={() => setActiveTab('grocery')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'grocery' && styles.tabButtonTextActive]}>
            GROCERY REQUESTS ({groceryRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Row */}
      <View style={styles.addInputRow}>
        <TextInput
          placeholder={activeTab === 'fridge' ? "Add item to fridge..." : "Add item to grocery requests..."}
          placeholderTextColor={colors.textSecondary}
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            handleAddItem(inputText, activeTab === 'grocery');
            setInputText('');
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'fridge' ? (
        <FlatList
          data={fridgeItems}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteFridgeItem(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Fridge is empty.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={groceryRequests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemStatusText}>
                  Requested by: {item.requestedBy.split('@')[0]}
                </Text>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.approveBtn, { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.accent, borderRadius: radii.sm }]}
                  onPress={() => handleApproveRequest(item)}
                >
                  <Ionicons name="checkmark" size={18} color={colors.accent} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.deleteBtn, { marginLeft: spacing.sm }]}
                  onPress={() => handleDeleteRequest(item.id)}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="cart-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No grocery requests pending.</Text>
            </View>
          }
        />
      )}

      {/* Floating Microphone Button */}
      <TouchableOpacity 
        style={[styles.fab, isRecording ? { backgroundColor: '#e74c3c' } : {}]}
        onPress={isRecording ? handleStopRecording : handleStartRecording}
      >
        <Ionicons name={isRecording ? "square" : "mic"} size={28} color="#fff" />
      </TouchableOpacity>

      {/* Processing Voice Input Modal */}
      <Modal
        visible={voiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.recordingContainer}>
              <Ionicons name="mic" size={48} color={colors.accent} />
              <Text style={styles.recordingText}>Processing speech with Sarvam STT...</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  tabButtonTextActive: {
    color: colors.textPrimary,
  },
  addInputRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    fontFamily: 'Inter',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  itemQty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  itemStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#2ecc71',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: 'rgba(241, 196, 15, 0.15)',
    borderWidth: 1,
    borderColor: '#f1c40f',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginRight: spacing.xs,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f1c40f',
    fontFamily: 'Inter',
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter',
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#001f3f', // dark blue
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.md,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  modalSub: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    marginBottom: spacing.md,
  },
  recordingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  recordingText: {
    color: colors.textPrimary,
    fontFamily: 'Inter',
    fontSize: 15,
    marginTop: spacing.md,
  },
  presetCard: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  presetText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    fontSize: 14,
  },
  presetDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 4,
  },
});

export default InventoryScreen;

