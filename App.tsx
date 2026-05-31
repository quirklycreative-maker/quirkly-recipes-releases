import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppFonts } from './src/hooks/useAppFonts';
import { DisclaimerProvider } from './src/context/DisclaimerContext';
import DisclaimerBanner from './src/components/DisclaimerBanner';
import { checkForUpdates } from './src/services/updateService';

export default function App() {
  const [fontsLoaded] = useAppFonts();
  
  useEffect(() => {
    checkForUpdates();
  }, []);

  if (!fontsLoaded) {
    console.log("Quirkly: Fonts are loading in background, using system fallback...");
  }
  return (
    <DisclaimerProvider>
      <SafeAreaProvider>
        <View style={styles.container}>
          <AppNavigator />
          <DisclaimerBanner />
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    </DisclaimerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f3f', // match dark theme background
  },
});
