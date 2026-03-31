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


export const CATEGORIES = [
  "Retail & E-commerce",
  "Payments & Remittances",
  "Finance & DeFi",
  "AI Agents & Automation",
  "Content & Media",
  "Gaming & Entertainment",
  "Travel & Hospitality",
  "Food & Beverage",
  "Services & Freelancers",
  "Real-World Assets (RWA)",
  "Infrastructure & Tools",
  "Charity & Social Good",
];

export const CATEGORY_EMOJIS: Record<string, string> = {
  "Retail & E-commerce": "🛒",
  "Payments & Remittances": "💳",
  "Finance & DeFi": "🏦",
  "AI Agents & Automation": "🤖",
  "Content & Media": "📺",
  "Gaming & Entertainment": "🎮",
  "Travel & Hospitality": "✈️",
  "Food & Beverage": "🍽️",
  "Services & Freelancers": "💼",
  "Real-World Assets (RWA)": "🏠",
  "Infrastructure & Tools": "⚙️",
  "Charity & Social Good": "💚",
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
