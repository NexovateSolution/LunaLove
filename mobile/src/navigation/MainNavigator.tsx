import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/config';
import { RootStackParamList } from './types';
import BottomTabNavigator from './BottomTabNavigator';

// Screens
import ChatScreen from '../screens/Chat/ChatScreenNew';
import BuyCoinsScreen from '../screens/BuyCoins/BuyCoinsScreen';
import PurchaseScreen from '../screens/Purchase/PurchaseScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import EarningsDashboardScreen from '../screens/Earnings/EarningsDashboardScreenNew';
import BankAccountSetupScreen from '../screens/BankAccount/BankAccountSetupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="BuyCoins" 
        component={BuyCoinsScreen}
        options={{
          headerShown: true,
          title: 'Buy Coins',
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />
      <Stack.Screen 
        name="Purchase" 
        component={PurchaseScreen}
        options={{
          headerShown: true,
          title: 'Upgrade',
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />
      <Stack.Screen 
        name="Earnings" 
        component={EarningsDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="BankAccountSetup" 
        component={BankAccountSetupScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
