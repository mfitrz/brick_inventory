import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://owffxalcdjmsukmeccid.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY || "sb_publishable_UWOWVPBxfTipZ3YzCenzkA_uy1_q_Nv";

// Base URL of the .NET LegoWebApp backend (no trailing slash).
// Uses LAN IP so the phone can reach the dev machine over WiFi.
export const API_URL = "https://brickinventory-production.up.railway.app";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getAuthHeaders = async (): Promise<Record<string, string> | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
};
