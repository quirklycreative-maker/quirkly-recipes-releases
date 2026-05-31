// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii } from '../theme/designTokens';
import DisclaimerModal from '../components/DisclaimerModal';

const SettingsScreen: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    // Show disclaimer modal on first launch
    const checkDisclaimer = async () => {
      const shown = await AsyncStorage.getItem('disclaimerShown');
      if (!shown) {
        setShowDisclaimer(true);
      }
    };
    checkDisclaimer();
  }, []);

  const toggleDisclaimer = async () => {
    await AsyncStorage.setItem('disclaimerShown', 'true');
    setShowDisclaimer(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>
      <TouchableOpacity style={styles.button} onPress={toggleDisclaimer}>
        <Text style={styles.buttonText}>Accept Disclaimer</Text>
      </TouchableOpacity>
      {showDisclaimer && <DisclaimerModal onClose={toggleDisclaimer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 18,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter',
  },
});

export default SettingsScreen;
