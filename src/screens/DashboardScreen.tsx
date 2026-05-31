// src/screens/DashboardScreen.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import RecipeListScreen from './RecipeListScreen';
import InventoryScreen from './InventoryScreen';
import ExerciseScreen from './ExerciseScreen';
import SettingsScreen from './SettingsScreen';
import { colors } from '../theme/designTokens';

const Tab = createBottomTabNavigator();

const DashboardScreen: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'ellipse';
          if (route.name === 'Recipes') {
            iconName = 'restaurant';
          } else if (route.name === 'Inventory') {
            iconName = 'cart';
          } else if (route.name === 'Exercise') {
            iconName = 'fitness';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Recipes" component={RecipeListScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Exercise" component={ExerciseScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default DashboardScreen;
