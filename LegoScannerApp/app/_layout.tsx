import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "../lib/supabase";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || (!fontsLoaded && !fontError)) return;

    const currentRoute = segments[0] as string;
    const isOnAuthScreen = currentRoute === "login" || currentRoute === "signup";

    if (!session && !isOnAuthScreen) {
      router.replace("/login");
    } else if (session && isOnAuthScreen) {
      router.replace("/");
    }
  }, [session, isLoading, segments, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fce8e8" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" options={{ animation: "none" }} />
      <Stack.Screen name="signup" options={{ animation: "none" }} />
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
