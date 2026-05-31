// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isMockFirebase } from '../firebaseConfig';
import { colors, spacing, radii } from '../theme/designTokens';

const LoginScreen: React.FC = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (isMockFirebase) {
      if (email.trim() && password.trim()) {
        navigation.navigate('RoleSelection');
      } else {
        Alert.alert('Login Bypass', 'In development mode. Enter any email and password to proceed.');
      }
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('RoleSelection');
    } catch (e) {
      Alert.alert('Login Failed', (e as any).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Quirkly</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    height: 48,
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontFamily: 'Inter',
  },
  button: {
    height: 48,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});

export default LoginScreen;
