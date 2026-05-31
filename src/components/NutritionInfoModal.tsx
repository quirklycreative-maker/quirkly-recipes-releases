import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/designTokens';

interface NutritionInfoModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: {
    glycemicLoad?: number;
    giLevel?: string;
    exactGI?: number;
    healthTip?: string;
  } | null;
}

export const NutritionInfoModal: React.FC<NutritionInfoModalProps> = ({ visible, onClose, recipe }) => {
  if (!recipe) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Nutritional Profile</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom:10, left:10, right:10}}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {recipe.glycemicLoad !== undefined ? (
            <Text style={styles.modalHeroText}>
              This recipe has a <Text style={{fontWeight: 'bold', color: recipe.glycemicLoad <= 10.9 ? '#2ecc71' : recipe.glycemicLoad <= 19.9 ? '#f1c40f' : '#e74c3c'}}>{recipe.glycemicLoad <= 10.9 ? 'LOW' : recipe.glycemicLoad <= 19.9 ? 'MEDIUM' : 'HIGH'}</Text> Glycemic Load of <Text style={{fontWeight: 'bold'}}>{recipe.glycemicLoad.toFixed(1)}</Text> and a <Text style={{fontWeight: 'bold', color: recipe.giLevel === 'unknown' ? '#95a5a6' : recipe.exactGI !== undefined && recipe.exactGI <= 55.9 ? '#2ecc71' : recipe.exactGI !== undefined && recipe.exactGI <= 69.9 ? '#f1c40f' : '#e74c3c'}}>{recipe.giLevel === 'unknown' ? 'UNKNOWN' : recipe.exactGI !== undefined && recipe.exactGI <= 55.9 ? 'LOW' : recipe.exactGI !== undefined && recipe.exactGI <= 69.9 ? 'MEDIUM' : 'HIGH'}</Text> Glycemic Index{recipe.exactGI !== undefined ? <Text> of <Text style={{fontWeight: 'bold'}}>{recipe.exactGI}</Text></Text> : ''}.
            </Text>
          ) : (
            <Text style={styles.modalHeroText}>
              This recipe has a <Text style={{fontWeight: 'bold'}}>{recipe.giLevel ? recipe.giLevel.toUpperCase() : 'UNKNOWN'}</Text> Glycemic Index{recipe.exactGI && recipe.exactGI > 0 ? ` (${recipe.exactGI})` : ''}.
            </Text>
          )}

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>What does this mean?</Text>
            <Text style={styles.modalBodyText}>
              <Text style={{fontWeight: 'bold'}}>Glycemic Index (GI)</Text> measures how fast a food raises blood sugar based on quality.
              {'\n\n'}
              <Text style={{fontWeight: 'bold'}}>Glycemic Load (GL)</Text> calculates the real-world impact by combining GI with the actual quantity (grams) of carbohydrates. A dish can have a high GI but a safe, low GL if the carb portion is very small.
            </Text>
          </View>

          <View style={styles.modalRangesRow}>
            <View style={styles.modalRangeColumn}>
              <Text style={styles.modalRangeTitle}>GL Ranges</Text>
              <Text style={styles.modalRangeItem}>🟢 Low: 0.0 - 10.9</Text>
              <Text style={styles.modalRangeItem}>🟡 Med: 11.0 - 19.9</Text>
              <Text style={styles.modalRangeItem}>🔴 High: 20.0+</Text>
            </View>
            <View style={styles.modalRangeColumn}>
              <Text style={styles.modalRangeTitle}>GI Ranges</Text>
              <Text style={styles.modalRangeItem}>🟢 Low: 0.0 - 55.9</Text>
              <Text style={styles.modalRangeItem}>🟡 Med: 56.0 - 69.9</Text>
              <Text style={styles.modalRangeItem}>🔴 High: 70.0+</Text>
            </View>
          </View>

          {recipe.healthTip ? (
            <View style={styles.modalTipBox}>
              <Text style={styles.modalTipText}>💡 <Text style={{fontWeight: 'bold'}}>AI Tip:</Text> {recipe.healthTip}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseBtnText}>Got it</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  modalHeroText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.md,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  modalBodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  modalRangesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalRangeColumn: {
    flex: 1,
  },
  modalRangeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalRangeItem: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  modalTipBox: {
    backgroundColor: 'rgba(0, 174, 239, 0.1)',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  modalTipText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  modalCloseBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  }
});
