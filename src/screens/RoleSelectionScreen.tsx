// src/screens/RoleSelectionScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { colors, spacing, radii } from '../theme/designTokens';
import { FirestoreService } from '../services/firestoreService';

const firestoreService = new FirestoreService();

/**
 * Determines a role based on the user's email address.
 * Simple heuristic: if the email includes the word "owner" → Owner role,
 * otherwise → Helper role.
 */
const inferRoleFromEmail = (email: string) => {
  return email.toLowerCase().includes('owner') ? 'Owner' : 'Helper';
};

const RoleSelectionScreen: React.FC<any> = ({ navigation }) => {
  const [role, setRole] = useState<'Owner' | 'Helper'>('Helper');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email) {
      const inferred = inferRoleFromEmail(user.email);
      setRole(inferred);
    } else {
      // If no user or email, default to Helper and let them continue.
      setRole('Helper');
    }
    setLoading(false);
  }, []);

  const handleProceed = async () => {
    const user = auth.currentUser;
    if (user) {
      await firestoreService.saveUserRole(user.uid, user.email || '', role);
    }
    // Navigate to the main dashboard after role determination.
    navigation.navigate('Dashboard');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {auth.currentUser?.email}</Text>
      <Text style={styles.subtitle}>You have been identified as a {role}.</Text>
      <TouchableOpacity style={styles.button} onPress={handleProceed}>
        <Text style={styles.buttonText}>Continue to Dashboard</Text>
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
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});

export default RoleSelectionScreen;
