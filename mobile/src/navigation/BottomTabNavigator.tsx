import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/config';

import HomeScreen from '../screens/Home/HomeScreenNew';
import MatchesScreen from '../screens/Matches/MatchesScreenNew';
import PurchaseScreen from '../screens/Purchase/PurchaseScreenNew';
import ProfileScreen from '../screens/Profile/ProfileScreenNew';
import SettingsScreen from '../screens/Settings/SettingsScreenNew';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Matches':
              iconName = 'chatbubbles';
              break;
            case 'Premium':
              iconName = 'card';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'home';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderLight,
          paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
          paddingTop: SPACING.sm,
          height: Platform.OS === 'ios' ? 72 : 64,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{ tabBarLabel: 'Matches' }}
      />
      <Tab.Screen 
        name="Premium" 
        component={PurchaseScreen}
        options={{ tabBarLabel: 'Premium' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
