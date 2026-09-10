import { executeWaynoSearch } from '../services/searchEngine';
import { SearchExecutionResultEnhanced } from '../types/search';

export interface AutomatedTestCase {
  id: string;
  requirementNumber: number;
  requirementTitle: string;
  query: string;
  expectedConcept: string;
  expectedCondition: (res: SearchExecutionResultEnhanced) => boolean;
  explanation: string;
}

export const SEARCH_BENCHMARK_SUITE: AutomatedTestCase[] = [
  // 1. Natural-language queries
  {
    id: 'tc_01',
    requirementNumber: 1,
    requirementTitle: 'Natural-Language Queries',
    query: 'things to wash clothes',
    expectedConcept: 'Laundry Detergents & Soaps (Omo, Sunlight, Menengai)',
    expectedCondition: (res) => {
      if (res.results.length === 0) return false;
      const topCategories = res.results.slice(0, 3).map((r) => r.product.internalCategory);
      return topCategories.some((c) => c.includes('Laundry') || c.includes('Cleaning'));
    },
    explanation: 'Translates conversational need into laundry detergents with high confidence.',
  },
  // 2. Misspellings
  {
    id: 'tc_02',
    requirementNumber: 2,
    requirementTitle: 'Misspellings & Typo Tolerance',
    query: 'bluband',
    expectedConcept: 'Blue Band Margarine',
    expectedCondition: (res) => {
      return res.results.length > 0 && res.results[0].product.brand === 'Blue Band';
    },
    explanation: 'Levenshtein typo correction identifies "bluband" as "Blue Band" and returns product.',
  },
  // 3. Kenyan terminology
  {
    id: 'tc_03',
    requirementNumber: 3,
    requirementTitle: 'Kenyan Terminology',
    query: 'posho',
    expectedConcept: 'Maize Meal Flour (Jogoo, Soko)',
    expectedCondition: (res) => {
      return res.results.length > 0 && res.results.some((r) => r.product.name.toLowerCase().includes('maize'));
    },
    explanation: 'Resolves Kenyan trade word "posho" to supreme maize meal.',
  },
  // 4. Swahili/Sheng terminology
  {
    id: 'tc_04',
    requirementNumber: 4,
    requirementTitle: 'Swahili/Sheng Terminology',
    query: 'njugu',
    expectedConcept: 'Njugu Karanga Groundnuts / Peanuts',
    expectedCondition: (res) => {
      return res.results.length > 0 && res.results[0].product.id === 'prod_njugu';
    },
    explanation: 'Sheng staple snack term "njugu" matches roasted groundnuts carton.',
  },
  // 5. Product aliases
  {
    id: 'tc_05',
    requirementNumber: 5,
    requirementTitle: 'Product Aliases',
    query: 'peanuts',
    expectedConcept: 'Groundnuts (Bi-directional alias)',
    expectedCondition: (res) => {
      return res.results.length > 0 && res.results[0].product.id === 'prod_njugu';
    },
    explanation: 'Synonym engine maps "peanuts" to catalog item "groundnuts / njugu karanga".',
  },
  // 6. Brand aliases
  {
    id: 'tc_06',
    requirementNumber: 6,
    requirementTitle: 'Brand Aliases',
    query: 'upfield',
    expectedConcept: 'Blue Band (Manufacturer brand alias)',
    expectedCondition: (res) => {
      return res.results.length > 0 && res.results[0].product.manufacturer.toLowerCase().includes('upfield');
    },
    explanation: 'Resolves Upfield manufacturer name to Blue Band product lines.',
  },
  // 7. Pack-size interpretation
  {
    id: 'tc_07',
    requirementNumber: 7,
    requirementTitle: 'Pack-Size Interpretation',
    query: 'unga 2kg',
    expectedConcept: '2kg Flour Bale (Extracted Pack Size = 2kg)',
    expectedCondition: (res) => {
      return (
        res.extractedPackSize !== undefined &&
        res.extractedPackSize.numericValue === 2 &&
        res.results.length > 0 &&
        res.results[0].product.packSize.includes('2kg')
      );
    },
    explanation: 'Regex parser extracts 2kg metric quantity and gives bonus to 2kg packs.',
  },
  // 8. Unit interpretation
  {
    id: 'tc_08',
    requirementNumber: 8,
    requirementTitle: 'Unit Interpretation',
    query: 'jogoo bale',
    expectedConcept: 'Bale unit match (B2B 12-packet bundle)',
    expectedCondition: (res) => {
      return res.extractedBulkUnit !== undefined && res.extractedBulkUnit.canonicalUnit === 'BALE';
    },
    explanation: 'Recognizes "bale" as a B2B packaging bundle unit.',
  },
  // 9. Query intent
  {
    id: 'tc_09',
    requirementNumber: 9,
    requirementTitle: 'Query Intent Classification',
    query: 'cheapest unga',
    expectedConcept: 'BARGAIN_PRICE intent detected',
    expectedCondition: (res) => {
      return res.detectedIntent === 'BARGAIN_PRICE' && res.results.length > 0;
    },
    explanation: 'Price sensitivity trigger "cheapest" activates bargain-hunting intent.',
  },
  // 10. Autocomplete
  {
    id: 'tc_10',
    requirementNumber: 10,
    requirementTitle: 'Real-Time Autocomplete',
    query: 'sabuni',
    expectedConcept: 'Returns Swahili soap products & Sheng badges',
    expectedCondition: (res) => {
      return res.results.length > 0 && res.detectedDialectTerms.some((d) => d.rawTerm === 'sabuni');
    },
    explanation: 'Instant dialect token breakdown and Swahili definition tags.',
  },
  // 11. Zero-result handling
  {
    id: 'tc_11',
    requirementNumber: 11,
    requirementTitle: 'Zero-Result Handling',
    query: 'imported french luxury caviar 500g',
    expectedConcept: 'Zero-Result graceful fallback with in-stock substitutes',
    expectedCondition: (res) => {
      return res.zeroResult === true && res.fallback !== undefined && res.fallback.closestSubstitutes.length > 0;
    },
    explanation: 'Never shows a dead-end blank screen; injects FMCG staple alternatives and supplier request alert.',
  },
  // 12. Ranking
  {
    id: 'tc_12',
    requirementNumber: 12,
    requirementTitle: 'Multi-Factor Algorithmic Ranking',
    query: 'cooking oil',
    expectedConcept: 'Composite multi-factor score breakdown calculated',
    expectedCondition: (res) => {
      return (
        res.results.length > 0 &&
        res.results[0].scoreBreakdown !== undefined &&
        res.results[0].scoreBreakdown.totalWeightedScore > 0
      );
    },
    explanation: 'Computes transparent Text, Geo, Price, Margin, Reliability, and Personalization factors.',
  },
  // 13. Supplier availability
  {
    id: 'tc_13',
    requirementNumber: 13,
    requirementTitle: 'Real-Time Supplier Availability',
    query: 'rina cooking oil',
    expectedConcept: 'Verified depot stock quantities (Eastleigh / Industrial)',
    expectedCondition: (res) => {
      return (
        res.results.length > 0 &&
        res.results[0].allSuppliers.length > 0 &&
        res.results[0].bestSupplierProduct.stockQty > 0
      );
    },
    explanation: 'Inspects live stock counts across multiple wholesale hubs in Nairobi.',
  },
  // 14. Geographic relevance
  {
    id: 'tc_14',
    requirementNumber: 14,
    requirementTitle: 'Geographic Relevance',
    query: 'fresh fri cooking oil near me',
    expectedConcept: 'Depot distance in km calculated from duka coordinates',
    expectedCondition: (res) => {
      return (
        res.results.length > 0 &&
        res.results[0].bestSupplierProduct.distanceKm > 0 &&
        res.results[0].deliveryEstimatedMins > 0
      );
    },
    explanation: 'Dynamic Haversine distance from retailer duka to wholesale depot with delivery ETA.',
  },
  // 15. Personalized ranking
  {
    id: 'tc_15',
    requirementNumber: 15,
    requirementTitle: 'Personalized Ranking',
    query: 'unga',
    expectedConcept: 'Personalization boost applied for shop purchase history',
    expectedCondition: (res) => {
      return (
        res.results.length > 0 &&
        res.results[0].scoreBreakdown.personalizedBoost > 0
      );
    },
    explanation: 'Provides personalized boost points for high-frequency staple reorders.',
  },
  // 16. Search analytics
  {
    id: 'tc_16',
    requirementNumber: 16,
    requirementTitle: 'Search Analytics & SLA',
    query: 'ketepa tea bags',
    expectedConcept: 'Latency < 50ms & telemetry logged',
    expectedCondition: (res) => {
      return res.executionTimeMs < 50 && res.results.length > 0;
    },
    explanation: 'Sub-50ms execution speed meets V1 high-throughput SLA.',
  },
];
