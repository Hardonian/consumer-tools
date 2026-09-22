import type { CategoryRule, EdgeCase } from '@/types'

export const categoryRules: CategoryRule[] = [
  {
    category: 'electronics',
    adjustments: {
      safety_concern: 1.5,
      warranty_complaint: 1.3,
      counterfeit_signal: 1.4,
      verified_inconsistency: 1.2,
      ai_generated_pattern: 1.1,
      detailed_reviews: 1.2,
    },
    description: 'Electronics carry higher risk for counterfeits, safety issues, and warranty problems.',
  },
  {
    category: 'tools',
    adjustments: {
      safety_concern: 1.6,
      warranty_complaint: 1.4,
      verified_consistent: 1.1,
      detailed_reviews: 1.2,
    },
    description: 'Tools carry significant safety risk. Safety concerns weighted heavily.',
  },
  {
    category: 'apparel',
    adjustments: {
      category_drift: 1.3,
      review_hijacking: 1.2,
      linguistic_mirror: 1.2,
      mixed_sentiment: 1.1,
    },
    description: 'Apparel has high variant confusion and review hijacking risk.',
  },
  {
    category: 'home_goods',
    adjustments: {
      safety_concern: 1.3,
      detailed_reviews: 1.1,
      temporal_natural: 1.1,
    },
    description: 'Home goods have moderate safety risk. Detailed reviews are more reliable.',
  },
  {
    category: 'digital',
    adjustments: {
      subscription_trap: 1.5,
      review_gap: 1.2,
      verified_inconsistency: 1.3,
      anonymity_ratio: 1.2,
    },
    description: 'Digital products have high subscription trap and verification risks.',
  },
  {
    category: 'food_supplement',
    adjustments: {
      safety_concern: 1.6,
      counterfeit_signal: 1.4,
      incentive_disclosure: 1.3,
      regulatory_concern: 1.5,
    },
    description: 'Food and supplements carry high safety and regulatory risk.',
  },
  {
    category: 'automotive',
    adjustments: {
      safety_concern: 1.7,
      warranty_complaint: 1.5,
      verified_consistent: 1.2,
      detailed_reviews: 1.3,
    },
    description: 'Automotive products have the highest safety weighting. Verified reviews carry more weight.',
  },
  {
    category: 'general',
    adjustments: {},
    description: 'Default category with no adjustments applied.',
  },
]

export const edgeCases: EdgeCase[] = [
  {
    id: 'EC-01',
    description: 'Product has fewer than 5 reviews',
    handling: 'Return UNKNOWN with note about insufficient data. Minimum threshold for analysis is 5 reviews.',
  },
  {
    id: 'EC-02',
    description: 'All reviews are the same rating',
    handling: 'Flag as suspicious. Natural products rarely have 100% uniform ratings. Increase confidence penalty.',
  },
  {
    id: 'EC-03',
    description: 'Product is brand new (listed < 7 days)',
    handling: 'Note that review patterns are not yet established. Lower confidence ceiling to 60%.',
  },
  {
    id: 'EC-04',
    description: 'Reviews in multiple languages',
    handling: 'Analyze each language group separately. Flag if sentiment differs significantly by language.',
  },
  {
    id: 'EC-05',
    description: 'Product has been re-listed under new ASIN/ID',
    handling: 'Detect listing age vs review age mismatch. Flag review hijacking risk.',
  },
  {
    id: 'EC-06',
    description: 'Review page uses infinite scroll',
    handling: 'Attempt to fetch paginated API endpoints. If unavailable, note data limitation.',
  },
  {
    id: 'EC-07',
    description: 'Reviews are behind login wall',
    handling: 'Return UNKNOWN. Cannot access authenticated content. Suggest user check manually.',
  },
  {
    id: 'EC-08',
    description: 'Product has been recalled',
    handling: 'If recall detected, return AVOID regardless of review scores. Flag safety concern prominently.',
  },
  {
    id: 'EC-09',
    description: 'Seller has multiple storefronts for same product',
    handling: 'Detect duplicate listings. Flag potential review fragmentation or manipulation.',
  },
  {
    id: 'EC-10',
    description: 'Review system uses non-standard rating scale',
    handling: 'Normalize ratings to 5-point scale. Detect and handle 10-point, percentage, or thumbs-up/down systems.',
  },
]

export function getCategoryRule(category: string): CategoryRule | undefined {
  return categoryRules.find((cr) => cr.category === category.toLowerCase())
}

export function detectCategory(productName: string, metadata: Record<string, unknown>): string {
  const name = productName.toLowerCase()
  const description = String(metadata.description || '').toLowerCase()
  const combined = `${name} ${description}`

  if (/\b(phone|laptop|tablet|headphones?|speakers?|cameras?|tv|monitor|charger|cables?|batter(?:y|ies)|usb|bluetooth|wireless|electronics?)\b/i.test(combined)) {
    return 'electronics'
  }
  if (/\b(drill|saw|hammer|wrench|tools?|sander|grinder|driver|pliers|socket)\b/i.test(combined)) {
    return 'tools'
  }
  if (/\b(shirts?|pants?|dress|shoes?|jackets?|coats?|hats?|socks?|apparel|clothing|fashion|wear)\b/i.test(combined)) {
    return 'apparel'
  }
  if (/\b(furniture|lamps?|curtains?|rugs?|pillows?|blankets?|decor|kitchen|cookware|appliances?)\b/i.test(combined)) {
    return 'home_goods'
  }
  if (/\b(software|apps?|subscription|games?|downloads?|digital|ebooks?|courses?|streaming)\b/i.test(combined)) {
    return 'digital'
  }
  if (/\b(vitamins?|supplements?|protein|pills?|capsules?|powders?|herbs?|organic|health)\b/i.test(combined)) {
    return 'food_supplement'
  }
  if (/\b(car|auto|vehicles?|tires?|oil|brakes?|filters?|motors?|engines?|automotive)\b/i.test(combined)) {
    return 'automotive'
  }
  return 'general'
}

export function getEdgeCase(id: string): EdgeCase | undefined {
  return edgeCases.find((ec) => ec.id === id)
}
