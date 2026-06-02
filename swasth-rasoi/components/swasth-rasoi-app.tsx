import { usePersistentState } from '@/lib/storage';
import { safeMessagesForRole } from '@/lib/privacy';
import {
  estimateGiFromText,
  giLabelForScore,
  parseGroceryItems,
  recipeMatches,
  summarizeYoutubeRecipe,
  youtubeSearchUrl,
} from '@/lib/recommendations';
import type {
  ChatAttachmentType,
  ChatMessage,
  DietaryProfile,
  GroceryRequest,
  LanguageCode,
  RecipeMatch,
  UserRole,
} from '@/types/app';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Notifications from 'expo-notifications';
import {
  Bell,
  Bot,
  Camera,
  CheckCircle2,
  ChefHat,
  Circle,
  Dumbbell,
  FileImage,
  Film,
  HeartPulse,
  Languages,
  Leaf,
  LogOut,
  MessageCircle,
  Mic,
  MicOff,
  PlayCircle,
  Send,
  ShoppingBasket,
  Sparkles,
  Trash2,
  UserRound,
  Utensils,
} from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  useWindowDimensions,
  View,
} from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const defaultProfile: DietaryProfile = {
  weightKg: 108,
  hba1c: 7.6,
  preference: 'mostly-veg',
  fastingGlucose: '',
  bloodPressure: '',
  restingHeartRate: '',
  steps: '',
  sleepHours: '',
  huaweiLinked: false,
};

const languageLabels: Record<LanguageCode, string> = {
  'hi-IN': 'हिंदी',
  'ne-NP': 'नेपाली',
  'en-IN': 'English',
};

const foodPreferenceLabels: Record<DietaryProfile['preference'], string> = {
  'mostly-veg': 'Veg',
  'veg-egg': 'Veg + egg',
  'veg-chicken-egg': 'Veg + egg/chicken',
};

const tabularNums: TextStyle['fontVariant'] = ['tabular-nums'];

type VoiceTarget = 'inventory' | 'grocery';

export function SwasthRasoiApp() {
  const [role, setRole, roleReady] = usePersistentState<UserRole | null>('swasth-role', null);
  const [profile, setProfile, profileReady] = usePersistentState<DietaryProfile>(
    'swasth-profile',
    defaultProfile
  );
  const [language, setLanguage, languageReady] = usePersistentState<LanguageCode>(
    'swasth-language',
    'hi-IN'
  );
  const [inventory, setInventory, inventoryReady] = usePersistentState(
    'swasth-inventory',
    'पालक, दही, टमाटर, प्याज, मूंग दाल'
  );
  const [requests, setRequests, requestsReady] = usePersistentState<GroceryRequest[]>(
    'swasth-grocery-requests',
    []
  );
  const [chatMessages, setChatMessages, chatReady] = usePersistentState<ChatMessage[]>(
    'swasth-family-chat',
    [
      {
        id: 'welcome-chat',
        createdAt: new Date().toISOString(),
        sender: 'ai',
        attachmentType: 'text',
        text: 'Family chat is ready. Owner vitals stay private and are not available to helper AI.',
      },
    ]
  );
  const [pin, setPin] = useState('');
  const [requestText, setRequestText] = useState('');
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const { width } = useWindowDimensions();
  const voiceTargetRef = useRef<VoiceTarget | null>(null);

  const isReady =
    roleReady && profileReady && languageReady && inventoryReady && requestsReady && chatReady;
  const recipeSuggestions = useMemo(
    () => recipeMatches(inventory, profile),
    [inventory, profile]
  );

  useSpeechRecognitionEvent('start', () => setIsListening(true));
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setVoiceTarget(null);
    voiceTargetRef.current = null;
  });
  useSpeechRecognitionEvent('error', (event) => {
    setSpeechError(event.message || 'Speech recognition failed.');
    setIsListening(false);
    setVoiceTarget(null);
    voiceTargetRef.current = null;
  });
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) {
      return;
    }
    if (voiceTargetRef.current === 'inventory') {
      setInventory(transcript);
    }
    if (voiceTargetRef.current === 'grocery') {
      setRequestText(transcript);
    }
  });

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void Notifications.setNotificationChannelAsync('grocery', {
      name: 'Grocery requests',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }, []);

  async function startListening(target: VoiceTarget) {
    try {
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        Alert.alert('Voice unavailable', 'Speech recognition is not available on this device.');
        return;
      }

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow microphone and speech recognition access.');
        return;
      }

      setSpeechError('');
      setVoiceTarget(target);
      voiceTargetRef.current = target;
      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      setSpeechError(error instanceof Error ? error.message : 'Unable to start voice input.');
      setIsListening(false);
      setVoiceTarget(null);
    }
  }

  function stopListening() {
    ExpoSpeechRecognitionModule.stop();
    voiceTargetRef.current = null;
  }

  async function notifyOwner(request: GroceryRequest) {
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New grocery request',
        body: request.items.length > 0 ? request.items.join(', ') : request.note,
      },
      trigger: null,
    });
  }

  async function addGroceryRequest(note: string, directItems?: string[]) {
    const items = directItems?.length ? directItems : parseGroceryItems(note);
    if (!note.trim() && items.length === 0) {
      Alert.alert('Empty request', 'Add at least one item before sending.');
      return;
    }

    const request: GroceryRequest = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      language,
      items,
      note: note.trim(),
      status: 'pending',
    };

    setRequests((current) => [request, ...current]);
    setRequestText('');
    await notifyOwner(request);
    Alert.alert('Sent', 'Owner login mein grocery request dikh jayegi.');
  }

  function addChatMessage(
    sender: UserRole | 'ai',
    text: string,
    attachmentType: ChatAttachmentType = 'text',
    mediaLabel?: string
  ) {
    const trimmed = text.trim();
    if (!trimmed && attachmentType === 'text') {
      return;
    }
    const isYoutube =
      attachmentType === 'youtube' || /youtu\.be|youtube\.com/i.test(trimmed || mediaLabel || '');
    const gi = estimateGiFromText(`${trimmed} ${mediaLabel ?? ''}`);
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      sender,
      attachmentType: isYoutube ? 'youtube' : attachmentType,
      text: trimmed || mediaLabel || attachmentType,
      mediaLabel,
      youtubeUrl: isYoutube ? trimmed : undefined,
      youtubeGist: isYoutube ? summarizeYoutubeRecipe(trimmed || mediaLabel || '') : undefined,
      giScore: isYoutube ? gi.score : undefined,
      giLabel: isYoutube ? gi.label : undefined,
    };
    setChatMessages((current) => [...current, message]);
  }

  function summarizeChat() {
    const recent = chatMessages.slice(-8);
    const requestsInChat = recent.filter((message) =>
      /order|चाहिए|लाना|need|buy|मंगाना/i.test(message.text)
    );
    const youtubeCount = recent.filter((message) => message.attachmentType === 'youtube').length;
    const summary = [
      `${recent.length} recent messages reviewed.`,
      requestsInChat.length
        ? `${requestsInChat.length} message(s) look like grocery or cooking requests.`
        : 'No urgent grocery request detected in recent chat.',
      youtubeCount ? `${youtubeCount} YouTube recipe link(s) were shared with GI estimates.` : '',
      'Private owner vitals were not included.',
    ]
      .filter(Boolean)
      .join(' ');
    addChatMessage('ai', summary);
  }

  function markRequest(id: string, status: GroceryRequest['status']) {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request))
    );
  }

  function deleteRequest(id: string) {
    setRequests((current) => current.filter((request) => request.id !== id));
  }

  function login(nextRole: UserRole) {
    const expectedPin = nextRole === 'owner' ? '1234' : '1111';
    if (pin && pin !== expectedPin) {
      Alert.alert('Wrong PIN', 'Owner PIN is 1234 and helper PIN is 1111 for this prototype.');
      return;
    }
    setRole(nextRole);
    setPin('');
  }

  if (!isReady) {
    return (
      <Screen>
        <Text style={styles.loading}>Loading Swasth Rasoi...</Text>
      </Screen>
    );
  }

  if (!role) {
    return <LoginScreen pin={pin} setPin={setPin} login={login} />;
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text selectable style={styles.kicker}>
            {role === 'owner' ? 'Owner login' : 'House help login'}
          </Text>
          <Text selectable style={styles.title}>
            {role === 'owner' ? 'Diet, groceries, movement' : 'Fridge se recipe'}
          </Text>
        </View>
        <IconButton label="Logout" onPress={() => setRole(null)}>
          <LogOut color="#1E293B" size={20} />
        </IconButton>
      </View>

      {role === 'owner' ? (
        <OwnerDashboard
          profile={profile}
          setProfile={setProfile}
          requests={requests}
          markRequest={markRequest}
          deleteRequest={deleteRequest}
          chatMessages={chatMessages}
          addChatMessage={addChatMessage}
          summarizeChat={summarizeChat}
          width={width}
        />
      ) : (
        <HelperDashboard
          preference={profile.preference}
          inventory={inventory}
          setInventory={setInventory}
          requestText={requestText}
          setRequestText={setRequestText}
          language={language}
          setLanguage={setLanguage}
          recipes={recipeSuggestions}
          addGroceryRequest={addGroceryRequest}
          startListening={startListening}
          stopListening={stopListening}
          isListening={isListening}
          voiceTarget={voiceTarget}
          speechError={speechError}
          chatMessages={chatMessages}
          addChatMessage={addChatMessage}
          summarizeChat={summarizeChat}
        />
      )}
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

function LoginScreen({
  pin,
  setPin,
  login,
}: {
  pin: string;
  setPin: (value: string) => void;
  login: (role: UserRole) => void;
}) {
  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <Leaf color="#1F7A4D" size={26} />
        </View>
        <Text selectable style={styles.title}>
          Swasth Rasoi
        </Text>
        <Text selectable style={styles.bodyText}>
          Low-GI Indian meal planning, simple movement, fridge recipes, and grocery requests.
        </Text>
      </View>

      <Card>
        <Text selectable style={styles.cardTitle}>
          Login PIN
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="Optional PIN"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          style={styles.input}
        />
        <Text selectable style={styles.mutedText}>
          Prototype PINs: owner 1234, helper 1111.
        </Text>
      </Card>

      <View style={styles.roleGrid}>
        <Pressable style={styles.roleCard} onPress={() => login('owner')}>
          <UserRound color="#1E293B" size={28} />
          <Text selectable style={styles.cardTitle}>
            Owner
          </Text>
          <Text selectable style={styles.mutedText}>
            Grocery approvals, profile, and movement plan.
          </Text>
        </Pressable>

        <Pressable style={styles.roleCard} onPress={() => login('helper')}>
          <ChefHat color="#1E293B" size={28} />
          <Text selectable style={styles.cardTitle}>
            Helper
          </Text>
          <Text selectable style={styles.mutedText}>
            Hindi/Nepali voice input and recipe suggestions.
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function OwnerDashboard({
  profile,
  setProfile,
  requests,
  markRequest,
  deleteRequest,
  chatMessages,
  addChatMessage,
  summarizeChat,
  width,
}: {
  profile: DietaryProfile;
  setProfile: (value: DietaryProfile | ((current: DietaryProfile) => DietaryProfile)) => void;
  requests: GroceryRequest[];
  markRequest: (id: string, status: GroceryRequest['status']) => void;
  deleteRequest: (id: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (
    sender: UserRole | 'ai',
    text: string,
    attachmentType?: ChatAttachmentType,
    mediaLabel?: string
  ) => void;
  summarizeChat: () => void;
  width: number;
}) {
  const pending = requests.filter((request) => request.status === 'pending');
  const columns = width > 760 ? 'wide' : 'narrow';

  return (
    <>
      <View style={[styles.dashboardGrid, columns === 'wide' && styles.dashboardGridWide]}>
        <Card style={columns === 'wide' ? styles.gridItem : undefined}>
          <View style={styles.cardHeader}>
            <Leaf color="#1F7A4D" size={22} />
            <Text selectable style={styles.cardTitle}>
              Health profile
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Metric label="HbA1c" value={`${profile.hba1c}`} tone="coral" />
            <Metric label="Weight" value={`${profile.weightKg} kg`} tone="green" />
          </View>
          <Text selectable style={styles.bodyText}>
            Educational support only: balanced portions, lower-GI ingredients, and simple movement.
            Doctor or dietitian guidance still matters for diabetes care.
          </Text>
        </Card>

        <Card style={columns === 'wide' ? styles.gridItem : undefined}>
          <Text selectable style={styles.cardTitle}>
            Food preference
          </Text>
          <SegmentedControl
            value={profile.preference}
            options={(['mostly-veg', 'veg-egg', 'veg-chicken-egg'] as const).map((item) => ({
              value: item,
              label: foodPreferenceLabels[item],
            }))}
            onChange={(preference) => setProfile((current) => ({ ...current, preference }))}
          />
        </Card>
      </View>

      <OwnerVitalsCard profile={profile} setProfile={setProfile} />

      <Card>
        <View style={styles.cardHeader}>
          <Bell color="#B45309" size={22} />
          <Text selectable style={styles.cardTitle}>
            Grocery requests
          </Text>
          <Badge label={`${pending.length} pending`} />
        </View>
        {requests.length === 0 ? (
          <Text selectable style={styles.mutedText}>
            No requests yet. Helper requests will appear here.
          </Text>
        ) : (
          <View style={styles.list}>
            {requests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <Pressable
                  onPress={() =>
                    markRequest(request.id, request.status === 'pending' ? 'done' : 'pending')
                  }
                  style={styles.inlineIcon}>
                  {request.status === 'done' ? (
                    <CheckCircle2 color="#1F7A4D" size={22} />
                  ) : (
                    <Circle color="#64748B" size={22} />
                  )}
                </Pressable>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text selectable style={styles.bodyText}>
                    {request.items.length > 0 ? request.items.join(', ') : request.note}
                  </Text>
                  <Text selectable style={styles.mutedText}>
                    {languageLabels[request.language]} · {new Date(request.createdAt).toLocaleString()}
                  </Text>
                </View>
                <IconButton label="Delete" onPress={() => deleteRequest(request.id)}>
                  <Trash2 color="#B91C1C" size={18} />
                </IconButton>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <ShoppingBasket color="#0F766E" size={22} />
          <Text selectable style={styles.cardTitle}>
            Low-GI grocery basket
          </Text>
        </View>
        <View style={styles.chipGrid}>
          {[
            'Moong dal',
            'Chana dal',
            'Besan',
            'Lauki',
            'Bhindi',
            'Palak',
            'Methi',
            'Curd',
            'Tofu or paneer',
            'Millet roti flour',
            profile.preference !== 'mostly-veg' ? 'Eggs' : 'Peanuts',
            profile.preference === 'veg-chicken-egg' ? 'Chicken breast' : 'Cucumber',
          ].map((item) => (
            <View key={item} style={styles.chip}>
              <Text selectable style={styles.chipText}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Dumbbell color="#7C3AED" size={22} />
          <Text selectable style={styles.cardTitle}>
            Simple exercise
          </Text>
        </View>
        <View style={styles.list}>
          {[
            ['After meals', '10 minutes easy walk after lunch and dinner.'],
            ['Strength', '2 rounds: wall push-ups, chair sit-to-stand, standing calf raises.'],
            ['Mobility', '5 minutes shoulder circles, ankle circles, hamstring stretch.'],
            ['Progress', 'Add 2 minutes per walk when it feels comfortable.'],
          ].map(([label, text]) => (
            <View key={label} style={styles.exerciseRow}>
              <Badge label={label} />
              <Text selectable style={styles.bodyText}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <ChatPanel
        role="owner"
        messages={chatMessages}
        addChatMessage={addChatMessage}
        summarizeChat={summarizeChat}
      />

      <AIAssistantCard role="owner" profile={profile} messages={chatMessages} />
    </>
  );
}

function HelperDashboard({
  preference,
  inventory,
  setInventory,
  requestText,
  setRequestText,
  language,
  setLanguage,
  recipes,
  addGroceryRequest,
  startListening,
  stopListening,
  isListening,
  voiceTarget,
  speechError,
  chatMessages,
  addChatMessage,
  summarizeChat,
}: {
  preference: DietaryProfile['preference'];
  inventory: string;
  setInventory: (value: string) => void;
  requestText: string;
  setRequestText: (value: string) => void;
  language: LanguageCode;
  setLanguage: (value: LanguageCode) => void;
  recipes: RecipeMatch[];
  addGroceryRequest: (note: string, directItems?: string[]) => Promise<void>;
  startListening: (target: VoiceTarget) => void;
  stopListening: () => void;
  isListening: boolean;
  voiceTarget: VoiceTarget | null;
  speechError: string;
  chatMessages: ChatMessage[];
  addChatMessage: (
    sender: UserRole | 'ai',
    text: string,
    attachmentType?: ChatAttachmentType,
    mediaLabel?: string
  ) => void;
  summarizeChat: () => void;
}) {
  return (
    <>
      <Card>
        <View style={styles.cardHeader}>
          <Languages color="#0F766E" size={22} />
          <Text selectable style={styles.cardTitle}>
            भाषा
          </Text>
        </View>
        <SegmentedControl
          value={language}
          options={(['hi-IN', 'ne-NP', 'en-IN'] as const).map((item) => ({
            value: item,
            label: languageLabels[item],
          }))}
          onChange={setLanguage}
        />
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Utensils color="#1F7A4D" size={22} />
          <Text selectable style={styles.cardTitle}>
            Fridge items
          </Text>
        </View>
        <TextInput
          value={inventory}
          onChangeText={setInventory}
          placeholder="जैसे: पालक, दही, मूंग दाल, टमाटर"
          multiline
          style={[styles.input, styles.textArea]}
        />
        <VoiceButton
          active={isListening && voiceTarget === 'inventory'}
          label={isListening && voiceTarget === 'inventory' ? 'Stop' : 'Speak fridge items'}
          onPress={() =>
            isListening && voiceTarget === 'inventory' ? stopListening() : startListening('inventory')
          }
        />
        {speechError ? (
          <Text selectable style={styles.errorText}>
            {speechError}
          </Text>
        ) : null}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <ChefHat color="#B45309" size={22} />
          <Text selectable style={styles.cardTitle}>
            आज क्या बनाएं
          </Text>
          <Badge label={foodPreferenceLabels[preference]} />
        </View>
        <View style={styles.list}>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} addGroceryRequest={addGroceryRequest} />
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <ShoppingBasket color="#0F766E" size={22} />
          <Text selectable style={styles.cardTitle}>
            Order request
          </Text>
        </View>
        <TextInput
          value={requestText}
          onChangeText={setRequestText}
          placeholder="हिंदी/नेपाली में बोलें या लिखें: दही, पालक, अंडे चाहिए"
          multiline
          style={[styles.input, styles.textArea]}
        />
        <View style={styles.actionRow}>
          <VoiceButton
            active={isListening && voiceTarget === 'grocery'}
            label={isListening && voiceTarget === 'grocery' ? 'Stop' : 'Speak order'}
            onPress={() =>
              isListening && voiceTarget === 'grocery' ? stopListening() : startListening('grocery')
            }
          />
          <Pressable style={styles.primaryButton} onPress={() => addGroceryRequest(requestText)}>
            <Bell color="#FFFFFF" size={18} />
            <Text selectable style={styles.primaryButtonText}>
              Send
            </Text>
          </Pressable>
        </View>
      </Card>

      <ChatPanel
        role="helper"
        messages={chatMessages}
        addChatMessage={addChatMessage}
        summarizeChat={summarizeChat}
      />

      <AIAssistantCard role="helper" messages={chatMessages} />
    </>
  );
}

function OwnerVitalsCard({
  profile,
  setProfile,
}: {
  profile: DietaryProfile;
  setProfile: (value: DietaryProfile | ((current: DietaryProfile) => DietaryProfile)) => void;
}) {
  const update = (field: keyof DietaryProfile, value: string | boolean) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  return (
    <Card>
      <View style={styles.cardHeader}>
        <HeartPulse color="#B45309" size={22} />
        <Text selectable style={styles.cardTitle}>
          Owner vitals
        </Text>
        <Badge label={profile.huaweiLinked ? 'Huawei linked' : 'Manual'} />
      </View>
      <Text selectable style={styles.mutedText}>
        These stay private in owner login. Helper chat and helper AI cannot see HbA1c, weight, or
        vitals.
      </Text>
      <View style={styles.inputGrid}>
        <TextInput
          value={profile.fastingGlucose}
          onChangeText={(value) => update('fastingGlucose', value)}
          placeholder="Fasting glucose"
          keyboardType="number-pad"
          style={[styles.input, styles.compactInput]}
        />
        <TextInput
          value={profile.bloodPressure}
          onChangeText={(value) => update('bloodPressure', value)}
          placeholder="Blood pressure"
          style={[styles.input, styles.compactInput]}
        />
        <TextInput
          value={profile.restingHeartRate}
          onChangeText={(value) => update('restingHeartRate', value)}
          placeholder="Resting HR"
          keyboardType="number-pad"
          style={[styles.input, styles.compactInput]}
        />
        <TextInput
          value={profile.steps}
          onChangeText={(value) => update('steps', value)}
          placeholder="Steps"
          keyboardType="number-pad"
          style={[styles.input, styles.compactInput]}
        />
        <TextInput
          value={profile.sleepHours}
          onChangeText={(value) => update('sleepHours', value)}
          placeholder="Sleep hours"
          keyboardType="decimal-pad"
          style={[styles.input, styles.compactInput]}
        />
      </View>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => {
          update('huaweiLinked', !profile.huaweiLinked);
          Alert.alert(
            'Huawei Health',
            'Prototype toggle saved. Production build should use Health Connect or Huawei Health Kit with explicit owner consent.'
          );
        }}>
        <HeartPulse color="#1E293B" size={18} />
        <Text selectable style={styles.secondaryButtonText}>
          {profile.huaweiLinked ? 'Unlink Huawei Health' : 'Link Huawei Health'}
        </Text>
      </Pressable>
    </Card>
  );
}

function ChatPanel({
  role,
  messages,
  addChatMessage,
  summarizeChat,
}: {
  role: UserRole;
  messages: ChatMessage[];
  addChatMessage: (
    sender: UserRole | 'ai',
    text: string,
    attachmentType?: ChatAttachmentType,
    mediaLabel?: string
  ) => void;
  summarizeChat: () => void;
}) {
  const [draft, setDraft] = useState('');

  const sendText = () => {
    addChatMessage(role, draft);
    setDraft('');
  };
  const sendYoutube = () => {
    const value = draft.trim() || 'https://www.youtube.com/results?search_query=diabetes+friendly+indian+recipe+hindi';
    addChatMessage(role, value, 'youtube', 'YouTube recipe');
    setDraft('');
  };
  const sendMedia = (type: ChatAttachmentType, label: string) => {
    addChatMessage(role, label, type, label);
  };

  return (
    <Card>
      <View style={styles.cardHeader}>
        <MessageCircle color="#0F766E" size={22} />
        <Text selectable style={styles.cardTitle}>
          Family chat
        </Text>
        <Badge label="Owner + helper" />
      </View>
      <Text selectable style={styles.mutedText}>
        WhatsApp-style household chat for cooking, groceries, media, voice notes, and recipe links.
      </Text>

      <View style={styles.chatThread}>
        {messages.slice(-8).map((message) => (
          <View
            key={message.id}
            style={[
              styles.chatBubble,
              message.sender === role && styles.chatBubbleMine,
              message.sender === 'ai' && styles.chatBubbleAi,
            ]}>
            <Text selectable style={styles.chatSender}>
              {message.sender === 'ai' ? 'AI' : message.sender === 'owner' ? 'Owner' : 'Helper'} ·{' '}
              {message.attachmentType}
            </Text>
            <Text selectable style={styles.bodyText}>
              {message.text}
            </Text>
            {message.mediaLabel && message.attachmentType !== 'text' ? (
              <Text selectable style={styles.mutedText}>
                Attachment: {message.mediaLabel}
              </Text>
            ) : null}
            {message.youtubeGist ? (
              <View style={styles.gistBox}>
                <Text selectable style={styles.bodyText}>
                  {message.youtubeGist}
                </Text>
                <Text selectable style={styles.mutedText}>
                  Estimated recipe GI: {message.giLabel} ({message.giScore})
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Type message or paste YouTube recipe link"
        multiline
        style={[styles.input, styles.chatInput]}
      />
      <View style={styles.actionRow}>
        <Pressable style={styles.primaryButton} onPress={sendText}>
          <Send color="#FFFFFF" size={18} />
          <Text selectable style={styles.primaryButtonText}>
            Send
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={sendYoutube}>
          <PlayCircle color="#1E293B" size={18} />
          <Text selectable style={styles.secondaryButtonText}>
            YouTube
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => sendMedia('image', 'Image shared in chat')}>
          <FileImage color="#1E293B" size={18} />
          <Text selectable style={styles.secondaryButtonText}>
            Image
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => sendMedia('video', 'Video shared in chat')}>
          <Film color="#1E293B" size={18} />
          <Text selectable style={styles.secondaryButtonText}>
            Video
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => sendMedia('camera', 'Camera capture shared')}>
          <Camera color="#1E293B" size={18} />
          <Text selectable style={styles.secondaryButtonText}>
            Camera
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => sendMedia('voice', 'Voice note shared')}>
          <Mic color="#1E293B" size={18} />
          <Text selectable style={styles.secondaryButtonText}>
            Voice
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={summarizeChat}>
          <Sparkles color="#1E293B" size={18} />
          <Text selectable style={styles.secondaryButtonText}>
            Summarize
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

function AIAssistantCard({
  role,
  profile,
  messages,
}: {
  role: UserRole;
  profile?: DietaryProfile;
  messages: ChatMessage[];
}) {
  const visibleMessages = safeMessagesForRole(role, messages);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(
    role === 'owner'
      ? 'Ask about groceries, recipes, chat summaries, vitals, or Huawei Health sync planning.'
      : 'Ask about fridge items, recipes, order lists, YouTube recipe links, and cooking steps.'
  );

  const askAi = () => {
    const q = question.trim().toLowerCase();
    if (!q) {
      return;
    }
    if (role === 'helper' && /(hba1c|hb|weight|वजन|sugar|glucose|bp|blood pressure)/i.test(q)) {
      setAnswer('I cannot share owner HbA1c, weight, or vitals. I can help with recipes, groceries, and cooking steps.');
    } else if (/summar|summary|सारांश/i.test(q)) {
      setAnswer(
        `Recent chat summary: ${visibleMessages.slice(-5).length} recent messages, ${
          visibleMessages.filter((message) => message.attachmentType === 'youtube').length
        } YouTube recipe link(s), and no private owner vitals included.`
      );
    } else if (/huawei|health|vital|steps|sleep/i.test(q) && role === 'owner') {
      setAnswer(
        `Owner-only vitals area is ready. Huawei linked: ${
          profile?.huaweiLinked ? 'yes' : 'not yet'
        }. Production should use Health Connect/Huawei Health Kit with explicit consent.`
      );
    } else if (/youtube|video/i.test(q)) {
      setAnswer('Paste a YouTube recipe link in Family chat. I will add a gist and estimate recipe GI inside the app.');
    } else {
      setAnswer('Within app boundaries, I can help with low-GI meal ideas, fridge-to-recipe planning, grocery lists, and chat summaries.');
    }
    setQuestion('');
  };

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Bot color="#7C3AED" size={22} />
        <Text selectable style={styles.cardTitle}>
          AI assistant
        </Text>
        <Badge label={role === 'owner' ? 'Owner scope' : 'Helper scope'} />
      </View>
      <Text selectable style={styles.mutedText}>
        Separate AI space with app boundaries. Helper scope only sees non-private chat context.
      </Text>
      <View style={styles.gistBox}>
        <Text selectable style={styles.bodyText}>
          {answer}
        </Text>
      </View>
      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder={
          role === 'owner'
            ? 'Ask AI about recipes, groceries, summaries, or vitals sync'
            : 'Ask AI about recipes, groceries, YouTube links, or cooking steps'
        }
        multiline
        style={[styles.input, styles.chatInput]}
      />
      <Pressable style={styles.primaryButton} onPress={askAi}>
        <Sparkles color="#FFFFFF" size={18} />
        <Text selectable style={styles.primaryButtonText}>
          Ask AI
        </Text>
      </Pressable>
    </Card>
  );
}

function RecipeCard({
  recipe,
  addGroceryRequest,
}: {
  recipe: RecipeMatch;
  addGroceryRequest: (note: string, directItems?: string[]) => Promise<void>;
}) {
  const missingLabel =
    recipe.missing.length > 0 ? `Missing: ${recipe.missing.join(', ')}` : 'Ready from fridge';

  return (
    <View style={styles.recipeCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text selectable style={styles.recipeTitle}>
            {recipe.titleHi}
          </Text>
          <Text selectable style={styles.mutedText}>
            {recipe.giNote}
          </Text>
        </View>
        <Badge label={recipe.dietType} />
        <Badge label={`${giLabelForScore(recipe.giScore)} GI ${recipe.giScore}`} />
      </View>

      <Text selectable style={styles.bodyText}>
        {missingLabel}
      </Text>
      <View style={styles.steps}>
        {recipe.stepsHi.map((step, index) => (
          <Text selectable key={step} style={styles.stepText}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>
      <Text selectable style={styles.mutedText}>
        {recipe.why}
      </Text>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={async () => {
            const url = youtubeSearchUrl(recipe.youtubeQuery);
            try {
              const canOpen = await Linking.canOpenURL(url);
              if (!canOpen) {
                Alert.alert('Cannot open link', 'No browser app can handle this YouTube link.');
                return;
              }

              await Linking.openURL(url);
            } catch {
              Alert.alert('Link error', 'Could not open the YouTube recipe search.');
            }
          }}>
          <PlayCircle color="#1E293B" size={18} />
          <Text selectable style={styles.secondaryButtonText}>
            Hindi YouTube
          </Text>
        </Pressable>
        {recipe.missing.length > 0 ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              addGroceryRequest(`${recipe.titleHi} ke liye ${recipe.missing.join(', ')}`, recipe.missing)
            }>
            <ShoppingBasket color="#1E293B" size={18} />
            <Text selectable style={styles.secondaryButtonText}>
              Request items
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'green' | 'coral';
}) {
  return (
    <View style={[styles.metric, tone === 'coral' ? styles.metricCoral : styles.metricGreen]}>
      <Text selectable style={styles.metricLabel}>
        {label}
      </Text>
      <Text selectable style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Text selectable style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function VoiceButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.voiceButton, active && styles.voiceButtonActive]} onPress={onPress}>
      {active ? <MicOff color="#FFFFFF" size={18} /> : <Mic color="#1E293B" size={18} />}
      <Text selectable style={[styles.voiceButtonText, active && styles.voiceButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function IconButton({
  label,
  children,
  onPress,
}: {
  label: string;
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} style={styles.iconButton} onPress={onPress}>
      {children}
    </Pressable>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text selectable style={styles.badgeText}>
        {label}
      </Text>
    </View>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  content: {
    padding: 18,
    paddingBottom: 36,
    gap: 14,
  },
  loading: {
    color: '#475569',
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  hero: {
    gap: 10,
    paddingVertical: 8,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5F4EA',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  kicker: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900' as const,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800' as const,
  },
  bodyText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 21,
  },
  mutedText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top' as const,
  },
  chatInput: {
    minHeight: 54,
    textAlignVertical: 'top' as const,
  },
  inputGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  compactInput: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: '46%' as const,
  },
  roleGrid: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  dashboardGrid: {
    gap: 14,
  },
  dashboardGridWide: {
    flexDirection: 'row' as const,
  },
  gridItem: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  metric: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  metricGreen: {
    backgroundColor: '#E5F4EA',
  },
  metricCoral: {
    backgroundColor: '#FFE9DE',
  },
  metricLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900' as const,
    fontVariant: tabularNums,
  },
  segmented: {
    flexDirection: 'row' as const,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  segmentSelected: {
    backgroundColor: '#0F766E',
  },
  segmentText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  segmentTextSelected: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#3730A3',
    fontSize: 12,
    fontWeight: '800' as const,
  },
  list: {
    gap: 10,
  },
  requestItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 8,
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
  },
  inlineIcon: {
    width: 32,
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  chatThread: {
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE7EF',
    backgroundColor: '#F6FBF8',
  },
  chatBubble: {
    maxWidth: '88%' as const,
    alignSelf: 'flex-start' as const,
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE7EF',
    backgroundColor: '#FFFFFF',
  },
  chatBubbleMine: {
    alignSelf: 'flex-end' as const,
    borderColor: '#B7E4D3',
    backgroundColor: '#DCFCE7',
  },
  chatBubbleAi: {
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  chatSender: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  gistBox: {
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 10,
  },
  exerciseRow: {
    gap: 6,
    paddingBottom: 8,
  },
  recipeCard: {
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FCFFFD',
    padding: 12,
  },
  recipeTitle: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900' as const,
  },
  steps: {
    gap: 4,
  },
  stepText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#0F766E',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900' as const,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800' as const,
  },
  voiceButton: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  voiceButtonActive: {
    backgroundColor: '#B45309',
    borderColor: '#B45309',
  },
  voiceButtonText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900' as const,
  },
  voiceButtonTextActive: {
    color: '#FFFFFF',
  },
};
