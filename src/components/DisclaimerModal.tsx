import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radii } from '../theme/designTokens';

type Props = {
  visible?: boolean;
  onClose: () => void;
};

const DisclaimerModal: React.FC<Props> = ({ visible = true, onClose }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.backdrop}>
      <View style={styles.modal}>
        <Text style={styles.title}>Disclaimer</Text>
        <Text style={styles.body}>
          This app is for educational purposes only and does not provide medical advice.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>I Understand</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '80%',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  body: {
    fontSize: 16,
    marginBottom: spacing.lg,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
});

export default DisclaimerModal;
