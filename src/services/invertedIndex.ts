import { Product } from '../types/wayno';
import { PRODUCTS } from '../data/mockData';

// ---------------------------------------------------------------------------
// 1. INVERTED INDEX DATA STRUCTURE & BM25 SCORING ENGINE
// ---------------------------------------------------------------------------

export type IndexField = 
  | 'name' 
  | 'brand' 
  | 'category' 
  | 'description' 
  | 'keywords' 
  | 'synonyms' 
  | 'aliases' 
  | 'packSize'
  | 'unit';

export interface IndexPosting {
  docId: string;
  field: IndexField;
  termFrequency: number;
  fieldWeight: number;
}

export interface CandidateDocMatch {
  docId: string;
  bm25Score: number;
  matchedTerms: string[];
  fieldHits: Record<IndexField, number>;
  exactPhraseMatch: boolean;
}

const FIELD_WEIGHTS: Record<IndexField, number> = {
  name: 3.5,
  brand: 3.0,
  packSize: 2.2,
  aliases: 2.0,
  synonyms: 1.8,
  keywords: 1.5,
  category: 1.3,
  unit: 1.0,
  description: 0.8,
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'ya', 'wa', 'kwa', 'na', 'za'
]);

export class InvertedIndex {
  // Term -> list of Postings
  private postings: Map<string, IndexPosting[]> = new Map();
  // DocId -> document token length
  private docLengths: Map<string, number> = new Map();
  // Term -> number of documents containing term
  private docFrequencies: Map<string, number> = new Map();
  // Entire indexed vocabulary
  private vocabulary: Set<string> = new Set();
  // Trigram index for ultra-fast typo/sub-token lookups: trigram -> set of vocabulary words
  private trigramIndex: Map<string, Set<string>> = new Map();
  // DocId -> Product
  private docStore: Map<string, Product> = new Map();
  
  private totalDocs: number = 0;
  private totalTokens: number = 0;
  private avgDocLength: number = 0;

  constructor() {
    this.buildIndex(PRODUCTS);
  }

  public tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
  }

  private generateTrigrams(word: string): string[] {
    const padded = `$$${word}$$`;
    const trigrams: string[] = [];
    for (let i = 0; i <= padded.length - 3; i++) {
      trigrams.push(padded.substring(i, i + 3));
    }
    return trigrams;
  }

  public buildIndex(products: Product[]): void {
    this.postings.clear();
    this.docLengths.clear();
    this.docFrequencies.clear();
    this.vocabulary.clear();
    this.trigramIndex.clear();
    this.docStore.clear();

    this.totalDocs = products.length;
    let accumulatedTokens = 0;

    for (const product of products) {
      this.docStore.set(product.id, product);
      let docTokenCount = 0;

      const fieldData: Array<{ field: IndexField; text: string }> = [
        { field: 'name', text: product.name },
        { field: 'brand', text: product.brand },
        { field: 'category', text: product.internalCategory },
        { field: 'description', text: product.description },
        { field: 'keywords', text: product.keywords.join(' ') },
        { field: 'synonyms', text: product.synonyms.join(' ') },
        { field: 'aliases', text: product.aliases.join(' ') },
        { field: 'packSize', text: product.packSize },
        { field: 'unit', text: product.unit },
      ];

      const docTermFrequencies: Map<string, { [key in IndexField]?: number }> = new Map();

      for (const { field, text } of fieldData) {
        const tokens = this.tokenize(text);
        docTokenCount += tokens.length;

        for (const token of tokens) {
          this.vocabulary.add(token);

          // Add to trigrams
          const trigrams = this.generateTrigrams(token);
          for (const tri of trigrams) {
            if (!this.trigramIndex.has(tri)) {
              this.trigramIndex.set(tri, new Set());
            }
            this.trigramIndex.get(tri)!.add(token);
          }

          if (!docTermFrequencies.has(token)) {
            docTermFrequencies.set(token, {});
          }
          const fieldMap = docTermFrequencies.get(token)!;
          fieldMap[field] = (fieldMap[field] || 0) + 1;
        }
      }

      this.docLengths.set(product.id, docTokenCount);
      accumulatedTokens += docTokenCount;

      // Create postings for this document
      for (const [term, fieldFreqs] of docTermFrequencies.entries()) {
        this.docFrequencies.set(term, (this.docFrequencies.get(term) || 0) + 1);

        for (const [field, freq] of Object.entries(fieldFreqs) as Array<[IndexField, number]>) {
          if (!this.postings.has(term)) {
            this.postings.set(term, []);
          }
          this.postings.get(term)!.push({
            docId: product.id,
            field,
            termFrequency: freq,
            fieldWeight: FIELD_WEIGHTS[field] || 1.0,
          });
        }
      }
    }

    this.totalTokens = accumulatedTokens;
    this.avgDocLength = this.totalDocs > 0 ? accumulatedTokens / this.totalDocs : 0;
  }

  // BM25 IDF: log(1 + (N - n + 0.5) / (n + 0.5))
  public getIDF(term: string): number {
    const docFreq = this.docFrequencies.get(term) || 0;
    if (docFreq === 0) return 0;
    return Math.log(1 + (this.totalDocs - docFreq + 0.5) / (docFreq + 0.5));
  }

  // Fast Inverted Index candidate search
  public searchCandidates(
    tokens: string[],
    rawQuery: string
  ): { candidates: CandidateDocMatch[]; postingsEvaluated: number } {
    let postingsEvaluated = 0;
    const scores = new Map<string, {
      bm25: number;
      matchedTerms: Set<string>;
      fieldHits: Record<IndexField, number>;
    }>();

    const k1 = 1.2;
    const b = 0.75;
    const lowerRaw = rawQuery.toLowerCase();

    for (const token of tokens) {
      const postingsList = this.postings.get(token);
      if (!postingsList) continue;

      const idf = this.getIDF(token);

      for (const posting of postingsList) {
        postingsEvaluated++;
        const docLen = this.docLengths.get(posting.docId) || this.avgDocLength;
        const tf = posting.termFrequency;
        const weight = posting.fieldWeight;

        // BM25 term score component
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / (this.avgDocLength || 1)));
        const termScore = idf * (numerator / denominator) * weight;

        if (!scores.has(posting.docId)) {
          scores.set(posting.docId, {
            bm25: 0,
            matchedTerms: new Set(),
            fieldHits: {
              name: 0,
              brand: 0,
              category: 0,
              description: 0,
              keywords: 0,
              synonyms: 0,
              aliases: 0,
              packSize: 0,
              unit: 0,
            },
          });
        }

        const entry = scores.get(posting.docId)!;
        entry.bm25 += termScore;
        entry.matchedTerms.add(token);
        entry.fieldHits[posting.field] = (entry.fieldHits[posting.field] || 0) + 1;
      }
    }

    const candidateMatches: CandidateDocMatch[] = [];

    for (const [docId, data] of scores.entries()) {
      const product = this.docStore.get(docId);
      if (!product) continue;

      let exactPhraseMatch = false;
      if (lowerRaw.length > 2 && product.name.toLowerCase().includes(lowerRaw)) {
        exactPhraseMatch = true;
        data.bm25 += 25; // exact full phrase boost
      }

      // Percentage of query terms satisfied
      const termCoverage = tokens.length > 0 ? data.matchedTerms.size / tokens.length : 0;
      data.bm25 *= (0.6 + termCoverage * 0.4);

      candidateMatches.push({
        docId,
        bm25Score: Math.round(data.bm25 * 10) / 10,
        matchedTerms: Array.from(data.matchedTerms),
        fieldHits: data.fieldHits,
        exactPhraseMatch,
      });
    }

    candidateMatches.sort((a, b) => b.bm25Score - a.bm25Score);

    return {
      candidates: candidateMatches,
      postingsEvaluated,
    };
  }

  public getVocabulary(): string[] {
    return Array.from(this.vocabulary);
  }

  public getTrigramMatches(word: string): string[] {
    const trigrams = this.generateTrigrams(word);
    const candidateCounts = new Map<string, number>();

    for (const tri of trigrams) {
      const words = this.trigramIndex.get(tri);
      if (words) {
        for (const w of words) {
          candidateCounts.set(w, (candidateCounts.get(w) || 0) + 1);
        }
      }
    }

    // Return candidates that share at least 2 trigrams
    return Array.from(candidateCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([w]) => w);
  }

  public getIndexMetrics() {
    return {
      totalDocuments: this.totalDocs,
      totalTokensIndexed: this.totalTokens,
      uniqueTermsCount: this.vocabulary.size,
      avgDocLength: Math.round(this.avgDocLength * 10) / 10,
    };
  }
}

// Export singleton instance
export const invertedIndexInstance = new InvertedIndex();

// ---------------------------------------------------------------------------
// 2. BIDIRECTIONAL SYNONYM GRAPH ENGINE
// ---------------------------------------------------------------------------

export interface SynonymCluster {
  id: string;
  name: string;
  canonicalCategory: string;
  terms: string[];
}

export const FMCG_SYNONYM_CLUSTERS: SynonymCluster[] = [
  {
    id: 'syn_maize_flour',
    name: 'Maize Meal & Flour',
    canonicalCategory: 'Flour & Grains',
    terms: [
      'unga', 'unga wa ugali', 'maize flour', 'cornmeal', 'posho', 'sembe',
      'jogoo', 'pembe', 'soko', 'taifa', 'dola', 'raha', 'ugali flour'
    ]
  },
  {
    id: 'syn_cooking_oil',
    name: 'Edible Cooking Oils',
    canonicalCategory: 'Oils & Fats',
    terms: [
      'cooking oil', 'vegetable oil', 'mafuta ya kupikia', 'liquid oil',
      'edible oil', 'fresh fri', 'golden fry', 'salit', 'rado', 'top fry', 'bahari'
    ]
  },
  {
    id: 'syn_cooking_fat',
    name: 'Solid Cooking Fats',
    canonicalCategory: 'Oils & Fats',
    terms: [
      'cooking fat', 'solid fat', 'kimbo', 'kasuku', 'cowboy', 'chipo'
    ]
  },
  {
    id: 'syn_wheat_flour',
    name: 'Wheat & Baking Flour',
    canonicalCategory: 'Flour & Grains',
    terms: [
      'wheat flour', 'unga wa ngano', 'baking flour', 'all purpose flour',
      'chapati flour', 'exe', 'ajab', 'dola ngano'
    ]
  },
  {
    id: 'syn_peanuts',
    name: 'Roasted Peanuts & Groundnuts',
    canonicalCategory: 'Snacks & Confectionery',
    terms: [
      'njugu', 'karanga', 'peanuts', 'groundnuts', 'roasted peanuts',
      'salted peanuts', 'ground nuts'
    ]
  },
  {
    id: 'syn_washing_powder',
    name: 'Laundry Powder & Detergents',
    canonicalCategory: 'Laundry & Cleaning',
    terms: [
      'washing powder', 'detergent', 'powder soap', 'omo', 'ariel',
      'sunlight', 'toss', 'persil', 'soapy', 'cleaning powder'
    ]
  },
  {
    id: 'syn_bar_soap',
    name: 'Laundry Bar Soaps',
    canonicalCategory: 'Laundry & Cleaning',
    terms: [
      'bar soap', 'laundry soap', 'sabuni ya mti', 'sabuni ya kipande',
      'menengai', 'white star', 'jamaa', 'ushindi', 'long bar soap'
    ]
  },
  {
    id: 'syn_margarine',
    name: 'Margarine & Bread Spreads',
    canonicalCategory: 'Spreads & Condiments',
    terms: [
      'blue band', 'bluband', 'margarine', 'bread spread', 'siagi', 'table spread'
    ]
  },
  {
    id: 'syn_sugar',
    name: 'Cane Sugar',
    canonicalCategory: 'Packaged Foods',
    terms: [
      'sugar', 'sukari', 'white sugar', 'brown sugar', 'mumias', 'mara sugar', 'table sugar'
    ]
  },
  {
    id: 'syn_rice',
    name: 'Rice & Mchele',
    canonicalCategory: 'Flour & Grains',
    terms: [
      'rice', 'mchele', 'pishori', 'basmati', 'daawat', 'sunrice', 'aromatic rice'
    ]
  },
  {
    id: 'syn_tea',
    name: 'Tea Leaves & Chai',
    canonicalCategory: 'Beverages',
    terms: [
      'tea leaves', 'majani ya chai', 'chai', 'kericho gold', 'ketepa', 'fahari ya kenya', 'black tea'
    ]
  }
];

export class SynonymEngine {
  private termToClusterMap: Map<string, SynonymCluster> = new Map();

  constructor() {
    for (const cluster of FMCG_SYNONYM_CLUSTERS) {
      for (const term of cluster.terms) {
        this.termToClusterMap.set(term.toLowerCase(), cluster);
      }
    }
  }

  public expand(query: string, tokens: string[]): {
    expandedTerms: string[];
    synonymMatches: Array<{ original: string; expansions: string[]; clusterName: string }>;
  } {
    const lowerQuery = query.toLowerCase().trim();
    const expandedSet = new Set<string>();
    const matches: Array<{ original: string; expansions: string[]; clusterName: string }> = [];

    // 1. Check full query against multi-word synonyms
    for (const [term, cluster] of this.termToClusterMap.entries()) {
      if (lowerQuery === term || (term.length > 4 && lowerQuery.includes(term))) {
        const otherTerms = cluster.terms.filter((t) => t.toLowerCase() !== term);
        otherTerms.forEach((t) => expandedSet.add(t));
        matches.push({
          original: term,
          expansions: otherTerms,
          clusterName: cluster.name,
        });
      }
    }

    // 2. Check individual tokens
    for (const token of tokens) {
      const cluster = this.termToClusterMap.get(token);
      if (cluster) {
        const related = cluster.terms.filter((t) => t.toLowerCase() !== token);
        related.forEach((t) => expandedSet.add(t));
        if (!matches.some((m) => m.original === token)) {
          matches.push({
            original: token,
            expansions: related,
            clusterName: cluster.name,
          });
        }
      }
    }

    return {
      expandedTerms: Array.from(expandedSet),
      synonymMatches: matches,
    };
  }

  public getClusters(): SynonymCluster[] {
    return FMCG_SYNONYM_CLUSTERS;
  }
}

export const synonymEngineInstance = new SynonymEngine();

// ---------------------------------------------------------------------------
// 3. DAMERAU-LEVENSHTEIN FUZZY MATCHING ENGINE
// ---------------------------------------------------------------------------

export function calculateDamerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let minCost = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition (adjacent character swap, e.g. 'bluband' or 'jogoo' -> 'jgooo')
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        minCost = Math.min(minCost, matrix[i - 2][j - 2] + 1);
      }

      matrix[i][j] = minCost;
    }
  }

  return matrix[al][bl];
}

export interface DynamicFuzzyResult {
  original: string;
  bestCorrection: string;
  distance: number;
  confidence: number;
  matchedFrom: 'VOCABULARY' | 'SYNONYM' | 'BRAND';
}

export class FuzzySearchEngine {
  private vocabulary: string[] = [];

  constructor() {
    this.refreshVocabulary();
  }

  public refreshVocabulary(): void {
    const vocabSet = new Set<string>();

    // Add all tokens from inverted index
    invertedIndexInstance.getVocabulary().forEach((t) => vocabSet.add(t));

    // Add all brands & synonyms
    FMCG_SYNONYM_CLUSTERS.forEach((c) => {
      c.terms.forEach((t) => {
        t.split(/\s+/).forEach((part) => vocabSet.add(part.toLowerCase()));
      });
    });

    // Special known FMCG spellings in Kenya
    const specialDukaWords = [
      'blueband', 'bluband', 'freshfri', 'sunlight', 'menengai',
      'kasuku', 'kimbo', 'jogoo', 'pembe', 'soko', 'omoo', 'omo',
      'njugu', 'karanga', 'unga', 'sukari', 'mchele', 'bale', 'carton'
    ];
    specialDukaWords.forEach((w) => vocabSet.add(w));

    this.vocabulary = Array.from(vocabSet).filter((w) => w.length > 2);
  }

  public findBestFuzzyMatch(word: string, maxDistance: number = 2): DynamicFuzzyResult | null {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length <= 2) return null;

    // First check exact match
    if (this.vocabulary.includes(cleanWord)) {
      return {
        original: word,
        bestCorrection: cleanWord,
        distance: 0,
        confidence: 1.0,
        matchedFrom: 'VOCABULARY',
      };
    }

    // Use trigrams to narrow down candidate pool for speed (< 1ms)
    let candidates = invertedIndexInstance.getTrigramMatches(cleanWord);
    if (candidates.length === 0) {
      // Fallback to vocabulary subset of similar length (+/- 2 chars)
      candidates = this.vocabulary.filter(
        (v) => Math.abs(v.length - cleanWord.length) <= 2
      );
    }

    let bestMatch: string | null = null;
    let minDistance = maxDistance + 1;

    for (const candidate of candidates) {
      // Fast length check
      if (Math.abs(candidate.length - cleanWord.length) > maxDistance) continue;

      const dist = calculateDamerauLevenshtein(cleanWord, candidate);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = candidate;
        if (dist === 1) break; // Early exit on distance 1
      }
    }

    if (bestMatch && minDistance <= maxDistance) {
      const maxLen = Math.max(cleanWord.length, bestMatch.length);
      const confidence = Math.round((1 - minDistance / maxLen) * 100) / 100;
      return {
        original: word,
        bestCorrection: bestMatch,
        distance: minDistance,
        confidence,
        matchedFrom: 'VOCABULARY',
      };
    }

    return null;
  }
}

export const fuzzyEngineInstance = new FuzzySearchEngine();

// ---------------------------------------------------------------------------
// 4. GEO-AWARE AVAILABILITY & DELIVERY ZONING
// ---------------------------------------------------------------------------

export interface GeoDeliveryZoneInfo {
  zoneTier: 'LOCAL_CORRIDOR' | 'SUBCOUNTY_EXPRESS' | 'EXTENDED_DISPATCH' | 'OUT_OF_CORRIDOR';
  zoneName: string;
  distanceKm: number;
  estimatedMinutes: number;
  bodaFareKES: number;
  availableForDispatch: boolean;
  zoneBadgeColor: string;
}

export function evaluateGeoDeliveryZone(distanceKm: number): GeoDeliveryZoneInfo {
  const roundedDist = Math.round(distanceKm * 10) / 10;

  if (roundedDist <= 3.0) {
    return {
      zoneTier: 'LOCAL_CORRIDOR',
      zoneName: 'Zone 1: Local Boda Corridor',
      distanceKm: roundedDist,
      estimatedMinutes: Math.max(8, Math.round(roundedDist * 4 + 4)),
      bodaFareKES: 50,
      availableForDispatch: true,
      zoneBadgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  } else if (roundedDist <= 6.0) {
    return {
      zoneTier: 'SUBCOUNTY_EXPRESS',
      zoneName: 'Zone 2: Sub-County Express',
      distanceKm: roundedDist,
      estimatedMinutes: Math.round(roundedDist * 4 + 8),
      bodaFareKES: 100,
      availableForDispatch: true,
      zoneBadgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    };
  } else if (roundedDist <= 10.0) {
    return {
      zoneTier: 'EXTENDED_DISPATCH',
      zoneName: 'Zone 3: Extended Nairobi Dispatch',
      distanceKm: roundedDist,
      estimatedMinutes: Math.round(roundedDist * 4 + 14),
      bodaFareKES: 180,
      availableForDispatch: true,
      zoneBadgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  } else {
    return {
      zoneTier: 'OUT_OF_CORRIDOR',
      zoneName: 'Zone 4: Out of Corridor (>10km)',
      distanceKm: roundedDist,
      estimatedMinutes: 90,
      bodaFareKES: 350,
      availableForDispatch: false,
      zoneBadgeColor: 'bg-red-50 text-red-800 border-red-200',
    };
  }
}
