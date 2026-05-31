// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import { useAppFonts } from '../hooks/useAppFonts';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => (
  <DrawerContentScrollView {...props} style={styles.drawerScroll}>
    <View style={styles.header}>
      <Text style={styles.title}>Quirkly</Text>
    </View>
    <DrawerItemList {...props} />
  </DrawerContentScrollView>
);

export const AppNavigator: React.FC = () => {
  const [fontsLoaded] = useAppFonts();
  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Login"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Drawer.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ drawerItemStyle: { display: 'none' } }} 
        />
        <Drawer.Screen 
          name="RoleSelection" 
          component={RoleSelectionScreen} 
          options={{ drawerItemStyle: { display: 'none' } }} 
        />
        <Drawer.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
        />
        <Drawer.Screen 
          name="RecipeDetail" 
          component={RecipeDetailScreen} 
          options={{ drawerItemStyle: { display: 'none' } }} 
        />
        <Drawer.Screen 
          name="VideoPlayerScreen"
          component={VideoPlayerScreen}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
        <Drawer.Screen 
          name="Settings" 
          component={SettingsScreen} 
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  drawerScroll: {
    backgroundColor: '#001f3f',
  },
  header: {
    padding: 20,
    backgroundColor: '#003566',
    marginBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter',
  },
});
