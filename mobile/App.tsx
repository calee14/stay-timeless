// mobile/App.tsx
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './app/utils/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GetStartedScreen from './app/screens/GetStartedScreen';
import HomeScreen from './app/screens/HomeScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

const queryClient = new QueryClient();

const ONBOARDING_KEY = '@has_completed_onboarding';

function MainApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (isLoading) {
    return null; // Or a splash screen component
  }

  return (
    <>
      {hasCompletedOnboarding ? (
        <HomeScreen />
      ) : (
        <GetStartedScreen onComplete={completeOnboarding} />
      )}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Georgia': require('./assets/fonts/Georgia.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }
  return (

    <SafeAreaProvider onLayout={onLayoutRootView}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <MainApp />
        </QueryClientProvider>
      </trpc.Provider>
    </SafeAreaProvider>
  );
}
