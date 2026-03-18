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
    .from("partners")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching partners:", error);
    return [];
  }
  return (data as Partner[]) || [];
}

export async function fetchFeaturedPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("featured", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching featured partners:", error);
    return [];
  }
  return (data as Partner[]) || [];
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
];

export const REGIONS = [
  "Global",
  "North America",
  "Latin America",
  "Europe",
  "Africa",
  "Asia Pacific",
  "Middle East",
  "Emerging Markets",
];

export const NETWORKS = [
  "Ethereum",
  "Base",
  "Solana",
  "Polygon",
  "Arbitrum",
  "Noble",
  "Avalanche",
];
