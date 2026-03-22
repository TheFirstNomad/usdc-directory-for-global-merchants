import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/partners";
import { useState, useRef, useMemo, useEffect } from "react";

const categoryEmojis: Record<string, string> = {
  Payments: "💳",
  Remittances: "💸",
  Wallets: "👛",
  "On/Off-Ramps": "🔄",
  DeFi: "🏦",
  RWA: "🏠",
  Infrastructure: "⚙️",
  "AI Payments": "🤖",
  Enterprise: "🏢",
};

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  partnerCount: number;
  onCategorySelect: (cat: string) => void;
  selectedCategories: string[];
  partnerNames?: string[];
}

const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const duration = 1200;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}</span>;
};

const HeroSection = ({
  searchQuery,
  onSearchChange,
  onSearch,
  partnerCount,
  onCategorySelect,
  selectedCategories,
  partnerNames = [],
}: HeroSectionProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const nameMatches = partnerNames
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 3);
    const catMatches = CATEGORIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 2);
    return [...new Set([...
