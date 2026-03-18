ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS usdc_score integer DEFAULT 0;

-- Update usdc_score based on proprietary formula
UPDATE public.partners SET usdc_score = 
  (CASE WHEN featured = true THEN 30 ELSE 0 END) +
  (CASE WHEN array_length(use_cases, 1) >= 3 THEN 20 WHEN array_length(use_cases, 1) >= 1 THEN 10 ELSE 0 END) +
  (CASE WHEN length(description) > 50 THEN 10 ELSE 0 END) +
  (CASE WHEN website IS NOT NULL AND website != '' THEN 15 ELSE 0 END) +
  (CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 10 ELSE 0 END) +
  (CASE WHEN array_length(categories, 1) >= 2 THEN 15 ELSE 5 END);