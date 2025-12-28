import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from './src/store/authStore';
import { useWalletStore } from './src/store/walletStore';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AuthScreen from './src/screens/Auth/AuthScreen';
import MainNavigator from './src/navigation/MainNavigator';
import { RootStackParamList } from './src/navigation/types';
import ProfileSetupScreen from './src/screens/ProfileSetup/ProfileSetupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { isAuthenticated, isLoading, loadUser, hasCompletedProfileSetup, completeProfileSetup } = useAuthStore();
  const { fetchWallet } = useWalletStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!isAuthenticated ? (
                <Stack.Screen name="Auth" component={AuthScreen} />
              ) : !hasCompletedProfileSetup ? (
                <Stack.Screen name="ProfileSetup">
                  {() => (
                    <ProfileSetupScreen onFinish={completeProfileSetup} />
                  )}
                </Stack.Screen>
              ) : (
                <Stack.Screen name="Main" component={MainNavigator} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
