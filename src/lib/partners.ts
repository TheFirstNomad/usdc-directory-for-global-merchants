import { supabase } from "@/integrations/supabase/client";

export interface Partner {
  id: string;
  name: string;
  description: string;
  website: string | null;
  logo_url: string | null;
  logo_emoji: string;
  categories: string[];
  region: string;
  use_cases: string[];
  featured: boolean;
  created_at: string;
  usdc_score?: number;
}

export async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from("partners_public" as any)
    .select("id, name, description, website, logo_url, logo_emoji, categories, region, use_cases, featured, created_at, usdc_score, networks")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching partners:", error);
    return [];
  }
  return (data as unknown as Partner[]) || [];
}

export async function fetchFeaturedPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from("partners_public" as any)
    .select("id, name, description, website, logo_url, logo_emoji, categories, region, use_cases, featured, created_at, usdc_score, networks")
    .eq("featured", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching featured partners:", error);
    return [];
  }
  return (data as unknown as Partner[]) || [];
}

export async function submitPartnerApplication(submission: {
  company_name: string;
  contact_email: string;
  website: string;
  description: string;
  categories: string[];
  region: string;
}) {
  const { error } = await supabase.from("submissions").insert(submission);
  if (error) throw error;
}

export const CATEGORIES = [
  "Payments",
  "Remittances",
  "Wallets",
  "On/Off-Ramps",
  "DeFi",
  "RWA",
  "Infrastructure",
  "AI Payments",
  "Enterprise",
  "Restaurants & Cafes",
  "Hotels & Travel",
  "Casinos & Gambling",
  "Retail & Shops",
  "P2P Traders & Individuals",
  "Services & Freelancers",
  "AI Agents",
];

export const CATEGORY_EMOJIS: Record<string, string> = {
  Payments: "💳",
  Remittances: "💸",
  Wallets: "👛",
  "On/Off-Ramps": "🔄",
  DeFi: "🏦",
  RWA: "🏠",
  Infrastructure: "⚙️",
  "AI Payments": "🤖",
  Enterprise: "🏢",
  "Restaurants & Cafes": "🍽️",
  "Hotels & Travel": "🏨",
  "Casinos & Gambling": "🎰",
  "Retail & Shops": "🛒",
  "P2P Traders & Individuals": "👤",
  "Services & Freelancers": "💼",
};

export const REGIONS = [
  "Global",
  "Africa",
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Uganda",
  "Kampala",
  "Kenya",
  "Nigeria",
  "South Africa",
  "Other",
];

export const REGION_FLAGS: Record<string, string> = {
  Global: "🌍",
  Africa: "🌍",
  Europe: "🇪🇺",
  Asia: "🌏",
  "North America": "🇺🇸",
  "South America": "🌎",
  Uganda: "🇺🇬",
  Kampala: "🇺🇬",
  Kenya: "🇰🇪",
  Nigeria: "🇳🇬",
  "South Africa": "🇿🇦",
  Other: "📍",
};

export const NETWORKS = [
  "Ethereum",
  "Base",
  "Solana",
  "Polygon",
  "Arbitrum",
  "Noble",
  "Avalanche",
  "Arc",
];
