// src/screens/ExerciseScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { colors, spacing, radii } from '../theme/designTokens';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '../services/notificationService';

const notificationService = new NotificationService();

const ExerciseScreen: React.FC = () => {
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const handleReminderToggle = async (value: boolean) => {
    setReminderEnabled(value);
    if (value) {
      // Schedule reminder for 10 seconds from now
      await notificationService.scheduleLocalReminder(
        "Time for a Walk! 🚶",
        "Keep your blood sugar in check. Let's do a quick 15-minute walk!",
        10
      );
      Alert.alert(
        "Reminder Scheduled",
        "A local walk reminder has been scheduled for 10 seconds from now."
      );
    } else {
      Alert.alert(
        "Reminder Cancelled",
        "Your walk reminder has been turned off."
      );
    }
  };

  const exercises = [
    {
      id: '1',
      title: 'Post-Meal Walking',
      type: 'Aerobic',
      duration: '15-30 mins',
      intensity: 'Low',
      icon: 'walk-outline',
      benefits: 'Lowers postprandial glucose spike, improves insulin sensitivity.',
      instructions: [
        'Start walking within 15-30 minutes after completing a meal.',
        'Maintain a brisk but comfortable pace (you should be able to talk but not sing).',
        'Keep upright posture and swing arms gently.'
      ]
    },
    {
      id: '2',
      title: 'Vajrasana (Thunderbolt Pose)',
      type: 'Yoga',
      duration: '5-10 mins',
      intensity: 'Low',
      icon: 'fitness-outline',
      benefits: 'Aids digestion, stretches thighs, abdomen and improves posture.',
      instructions: [
        'Kneel on the floor, sitting back on your heels.',
        'Keep your spine and head erect, place hands on your knees.',
        'Close your eyes, breathe deeply, and focus on your digestion for 5-10 minutes.'
      ]
    },
    {
      id: '3',
      title: 'Gentle Leg Stretches',
      type: 'Stretching',
      duration: '5 mins',
      intensity: 'Low',
      icon: 'accessibility-outline',
      benefits: 'Improves joint flexibility and lower extremity circulation.',
      instructions: [
        'Sit on a chair, extend one leg straight out parallel to the floor.',
        'Flex your ankle, pointing toes up towards the ceiling. Hold for 10 seconds.',
        'Lower and repeat with the other leg. Do 5 repetitions per leg.'
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Diabetic Exercise Guide</Text>

      {/* Medical Safety Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Ionicons name="warning-outline" size={24} color="#ff7f50" style={styles.disclaimerIcon} />
        <View style={styles.disclaimerTextContainer}>
          <Text style={styles.disclaimerTitle}>Medical Safety Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Consult your healthcare provider before starting any exercise routine. Monitor your blood glucose levels before and after physical activity.
          </Text>
        </View>
      </View>

      {/* Reminder Setting Card */}
      <View style={styles.reminderCard}>
        <View style={styles.reminderRow}>
          <View style={styles.reminderTextContainer}>
            <Text style={styles.reminderTitleText}>Daily Walk Reminder</Text>
            <Text style={styles.reminderSubtitleText}>Receive alert to walk after meals</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={reminderEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Exercises List */}
      <Text style={styles.sectionHeader}>Recommended Routines</Text>
      {exercises.map((item) => (
        <View key={item.id} style={styles.exerciseCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={24} color={colors.accent} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.exerciseTitle}>{item.title}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.type}</Text></View>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.duration}</Text></View>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.intensity} Intensity</Text></View>
              </View>
            </View>
          </View>

          <Text style={styles.benefitText}><Text style={styles.boldText}>Benefit: </Text>{item.benefits}</Text>

          <Text style={styles.instructionsHeader}>How to perform:</Text>
          {item.instructions.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{idx + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 60, // accommodate status bar area
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 127, 80, 0.3)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  disclaimerTextContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff7f50',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  reminderCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  reminderSubtitleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
  },
  exerciseCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 127, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  instructionsHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: spacing.xs,
  },
  stepNumber: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: 'bold',
    width: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    lineHeight: 19,
  },
});

export default ExerciseScreen;
