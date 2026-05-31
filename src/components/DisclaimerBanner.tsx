import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDisclaimer } from '../context/DisclaimerContext';
import { colors, spacing, radii } from '../theme/designTokens';

const DisclaimerBanner: React.FC = () => {
  const { showBanner, acceptDisclaimer } = useDisclaimer();

  if (!showBanner) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ This app is for educational purposes only and does not provide medical advice.
      </Text>
      <TouchableOpacity style={styles.button} onPress={acceptDisclaimer}>
        <Text style={styles.buttonText}>I Understand</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(255, 127, 80, 0.15)', // transparent coral/orange
    borderColor: '#ff7f50',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'Inter',
    flex: 1,
    marginRight: spacing.sm,
  },
  button: {
    backgroundColor: '#ff7f50',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
});

export default DisclaimerBanner;
