import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0] as string;
    const isOnAuthScreen = currentRoute === "login" || currentRoute === "signup";

    if (!session && !isOnAuthScreen) {
      router.replace("/login" as never);
    } else if (session && isOnAuthScreen) {
      router.replace("/");
    }
  }, [session, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" />
    </Stack>
  );
}
