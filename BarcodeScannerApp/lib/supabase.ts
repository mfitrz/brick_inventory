import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://owffxalcdjmsukmeccid.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY || "sb_publishable_UWOWVPBxfTipZ3YzCenzkA_uy1_q_Nv";

export const API_URL = "http://192.168.1.220:8000";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
