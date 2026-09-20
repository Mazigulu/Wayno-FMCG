import { Product, SupplyNode } from '../types/wayno';
import { PRODUCTS } from '../data/mockData';
import { geoEngine, SUPPLY_NODES } from './hierarchicalGeofenceEngine';

// ---------------------------------------------------------------------------
// 1. TOPOLOGICAL TREE PRE-PRUNING & BITSET INVERTED NODE INDEX
// ---------------------------------------------------------------------------

/**
 * An in-memory Inverted Node Index for O(1) set-intersection pruning.
 * Maps supplyNodeId -> Set<productId>.
 * When a shopkeeper in a specific supply node (e.g. node_eastleigh_20km) executes a search,
 * the engine intersects candidates with the active bitset/Set before running text scoring.
 */
export class SupplyNodeBitmapIndex {
  // supplyNodeId -> Set of active product IDs visible & authorized for that node
  private nodeProductSets: Map<string, Set<string>> = new Map();
  // Quick lookup for root national products accessible across all nodes
  private rootNationalProductIds: Set<string> = new Set();
  // Timestamp of last compilation
  private compiledAt: number = 0;

  constructor() {
    this.rebuildIndex(PRODUCTS);
  }

  public rebuildIndex(products: Product[]): void {
    this.nodeProductSets.clear();
    this.rootNationalProductIds.clear();

    // Initialize an empty set for each known supply node
    for (const node of SUPPLY_NODES) {
      this.nodeProductSets.set(node.id, new Set<string>());
    }

    for (const product of products) {
      const level = product.supplyNodeLevel || 'ROOT';
      const assignedNodeIds = product.assignedSupplyNodeIds || [];

      if (level === 'ROOT') {
        // Universal National Grid: Eligible everywhere
        this.rootNationalProductIds.add(product.id);
        for (const nodeSet of this.nodeProductSets.values()) {
          nodeSet.add(product.id);
        }
        continue;
      }

      if (level === 'REGION') {
        // Belongs to regional subtrees
        for (const node of SUPPLY_NODES) {
          // If the node itself is assigned or its ancestor is in assignedNodeIds
          const ancestors = geoEngine.getAncestorHierarchy(node.id);
          const isRegionMatch = ancestors.some(
            (a) => assignedNodeIds.includes(a.id) || (assignedNodeIds.length === 0 && a.level === 'REGION')
          );
          if (isRegionMatch) {
            this.nodeProductSets.get(node.id)?.add(product.id);
          }
        }
        continue;
      }

      // LOCAL_NODE level
      const isAllLocalNodes =
        assignedNodeIds.length === 0 ||
        assignedNodeIds.includes('all_local_nodes') ||
        assignedNodeIds.includes('root_kenya');

      for (const node of SUPPLY_NODES) {
        if (node.level === 'LOCAL_NODE') {
          if (isAllLocalNodes || assignedNodeIds.includes(node.id)) {
            this.nodeProductSets.get(node.id)?.add(product.id);
          }
        }
      }
    }

    this.compiledAt = Date.now();
  }

  /**
   * Returns the pre-computed set of product IDs eligible for a given supply node.
   * If the node is not found, falls back to all national products.
   */
  public getEligibleProductIdsForNode(nodeId: string): Set<string> {
    const set = this.nodeProductSets.get(nodeId);
    if (set && set.size > 0) {
      return set;
    }
    return this.rootNationalProductIds;
  }

  public isProductEligibleInNode(nodeId: string, productId: string): boolean {
    const set = this.nodeProductSets.get(nodeId);
    if (!set) return this.rootNationalProductIds.has(productId);
    return set.has(productId);
  }

  public getStats() {
    return {
      compiledAt: this.compiledAt,
      totalNodesIndexed: this.nodeProductSets.size,
      rootNationalCount: this.rootNationalProductIds.size,
    };
  }
}

export const supplyNodeBitmapIndex = new SupplyNodeBitmapIndex();

// ---------------------------------------------------------------------------
// 2. RADIX TRIE FOR INSTANT PREFIX KEYSTROKE AUTOCOMPLETE (< 1ms)
// ---------------------------------------------------------------------------

export interface TriePayload {
  id: string;
  type: 'PRODUCT' | 'BRAND' | 'CATEGORY' | 'SHENG_VERNACULAR' | 'SYNONYM';
  title: string;
  subtitle: string;
  query: string;
  badge: string;
  iconName: string;
  popularityScore: number;
}

class TrieNode {
  public children: Map<string, TrieNode> = new Map();
  public isEndOfWord: boolean = false;
  // Top matched suggestions cached at this prefix node for ultra-fast O(prefix_length) retrieval
  public topMatches: TriePayload[] = [];
}

export class ProductPrefixTrie {
  private root: TrieNode = new TrieNode();
  private totalEntries: number = 0;

  constructor() {
    this.buildDefaultTrie();
  }

  public insert(word: string, payload: TriePayload): void {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return;

    let current = this.root;
    this.addPayloadToNode(current, payload);

    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
      this.addPayloadToNode(current, payload);
    }

    current.isEndOfWord = true;
    this.totalEntries++;
  }

  private addPayloadToNode(node: TrieNode, payload: TriePayload): void {
    // Check if already exists by id
    const existingIndex = node.topMatches.findIndex((p) => p.id === payload.id);
    if (existingIndex >= 0) {
      if (node.topMatches[existingIndex].popularityScore < payload.popularityScore) {
        node.topMatches[existingIndex] = payload;
      }
    } else {
      node.topMatches.push(payload);
    }
    // Sort descending by popularity score and cap at 10
    node.topMatches.sort((a, b) => b.popularityScore - a.popularityScore);
    if (node.topMatches.length > 10) {
      node.topMatches.length = 10;
    }
  }

  /**
   * Instant lookup of candidates beginning with prefix. O(L) where L is prefix length.
   */
  public searchPrefix(prefix: string, maxResults: number = 6): TriePayload[] {
    const cleanPrefix = prefix.trim().toLowerCase();
    if (!cleanPrefix) return [];

    let current = this.root;
    for (let i = 0; i < cleanPrefix.length; i++) {
      const char = cleanPrefix[i];
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    return current.topMatches.slice(0, maxResults);
  }

  public buildDefaultTrie(): void {
    this.root = new TrieNode();
    this.totalEntries = 0;

    // Index products
    for (const product of PRODUCTS) {
      const payload: TriePayload = {
        id: `prod_${product.id}`,
        type: 'PRODUCT',
        title: product.name,
        subtitle: `${product.packSize} • RRP KES ${product.recommendedRetailPrice}`,
        query: product.name,
        badge: product.internalCategory.split(' ')[0],
        iconName: 'ShoppingBag',
        popularityScore: 80,
      };

      // Index product full name
      this.insert(product.name, payload);

      // Index brand name
      this.insert(product.brand, {
        id: `brand_${product.brand.toLowerCase()}`,
        type: 'BRAND',
        title: product.brand,
        subtitle: 'FMCG Brand Catalog • Verified Kenyan distributor',
        query: product.brand.toLowerCase(),
        badge: 'Brand',
        iconName: 'Building',
        popularityScore: 90,
      });

      // Index product keywords
      for (const kw of product.keywords) {
        this.insert(kw, payload);
      }

      // Index product aliases
      for (const al of product.aliases) {
        this.insert(al, payload);
      }
    }

    // Index Kenyan Sheng / Swahili vernacular
    const shengEntries: Array<{ raw: string; concept: string; dialect: string; query: string }> = [
      { raw: 'unga', concept: 'maize flour', dialect: 'Swahili/Trade', query: 'unga wa ugali 2kg' },
      { raw: 'ugali', concept: 'maize flour', dialect: 'Swahili', query: 'unga wa ugali' },
      { raw: 'chapo', concept: 'wheat flour', dialect: 'Sheng', query: 'wheat flour' },
      { raw: 'mafuta', concept: 'cooking oil', dialect: 'Swahili', query: 'cooking oil' },
      { raw: 'salad', concept: 'liquid cooking oil', dialect: 'Kenyan English', query: 'fresh fri cooking oil' },
      { raw: 'sabuni', concept: 'laundry bar soap', dialect: 'Swahili', query: 'sabuni' },
      { raw: 'sukari', concept: 'sugar', dialect: 'Swahili', query: 'sugar' },
      { raw: 'chai', concept: 'tea leaves', dialect: 'Swahili', query: 'ketepa tea' },
      { raw: 'njugu', concept: 'roasted peanuts', dialect: 'Sheng', query: 'peanuts' },
      { raw: 'bluband', concept: 'blue band margarine', dialect: 'Vernacular', query: 'blue band' },
    ];

    for (const s of shengEntries) {
      this.insert(s.raw, {
        id: `sheng_${s.raw}`,
        type: 'SHENG_VERNACULAR',
        title: `${s.raw} (${s.concept})`,
        subtitle: `${s.dialect} • Quick vernacular shortcut`,
        query: s.query,
        badge: 'Sheng',
        iconName: 'Globe',
        popularityScore: 95,
      });
    }
  }

  public getTotalEntries(): number {
    return this.totalEntries;
  }
}

export const prefixTrieInstance = new ProductPrefixTrie();

// ---------------------------------------------------------------------------
// 3. HIERARCHICAL RADIUS BOUNDING BOXES (CHEAP FAST GEOMETRY)
// ---------------------------------------------------------------------------

export interface BoundingBox2D {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Computes an Axis-Aligned Bounding Box (AABB) in degrees for a center point and radius in km.
 * 1 degree latitude ~ 110.574 km.
 * 1 degree longitude ~ 111.320 * cos(lat) km.
 * Running an AABB check takes ~1 CPU cycle vs 50+ CPU cycles for Math.sin/cos/atan2 in Haversine.
 */
export function calculateAABB(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): BoundingBox2D {
  const latDelta = radiusKm / 110.574;
  const lngDelta = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));

  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLng: centerLng - lngDelta,
    maxLng: centerLng + lngDelta,
  };
}

export function isPointInAABB(
  lat: number,
  lng: number,
  box: BoundingBox2D
): boolean {
  return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
}

// ---------------------------------------------------------------------------
// 4. CLIENT-SIDE SNAPSHOT CACHE FOR RETAILER NODE
// ---------------------------------------------------------------------------

export interface LocalNodeIndexSnapshot {
  nodeId: string;
  nodeName: string;
  compiledTimestamp: number;
  cachedProductIds: string[];
  productCount: number;
  activeWholesalersCount: number;
  isOfflineCapable: boolean;
}

const LOCAL_STORAGE_KEY_PREFIX = 'wayno_node_index_snapshot_';

export class LocalNodeSnapshotCache {
  private inMemorySnapshots: Map<string, LocalNodeIndexSnapshot> = new Map();

  /**
   * Compiles and caches a snapshot of eligible products for a specific local node.
   */
  public compileSnapshotForNode(node: SupplyNode): LocalNodeIndexSnapshot {
    const eligibleIds = supplyNodeBitmapIndex.getEligibleProductIdsForNode(node.id);
    const snapshot: LocalNodeIndexSnapshot = {
      nodeId: node.id,
      nodeName: node.name,
      compiledTimestamp: Date.now(),
      cachedProductIds: Array.from(eligibleIds),
      productCount: eligibleIds.size,
      activeWholesalersCount: node.shopsCount > 0 ? 3 : 1,
      isOfflineCapable: true,
    };

    this.inMemorySnapshots.set(node.id, snapshot);

    // Save to localStorage for instant startup if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          `${LOCAL_STORAGE_KEY_PREFIX}${node.id}`,
          JSON.stringify(snapshot)
        );
      }
    } catch {
      // Ignore quota errors in private browsing
    }

    return snapshot;
  }

  public getSnapshot(nodeId: string): LocalNodeIndexSnapshot | undefined {
    if (this.inMemorySnapshots.has(nodeId)) {
      return this.inMemorySnapshots.get(nodeId);
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${nodeId}`);
        if (raw) {
          const parsed = JSON.parse(raw) as LocalNodeIndexSnapshot;
          this.inMemorySnapshots.set(nodeId, parsed);
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    return undefined;
  }
}

export const localNodeSnapshotCache = new LocalNodeSnapshotCache();
