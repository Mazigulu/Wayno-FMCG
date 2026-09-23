import { executeWaynoSearch, getAutocompleteSuggestions } from '../src/services/searchEngine';
import { supplyNodeBitmapIndex, prefixTrieInstance, calculateAABB, isPointInAABB } from '../src/services/fastSpatialSearchIndex';
import { geoEngine } from '../src/services/hierarchicalGeofenceEngine';
import { PRODUCTS } from '../src/data/mockData';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    testsFailed++;
  }
}

console.log('================================================================');
console.log('RUNNING PRODUCTION TEST SUITE: SEARCH ENGINE & SPATIAL OPTIMIZATION');
console.log('================================================================\n');

// 1. Inverted Node Bitset & Tree Pre-pruning
console.log('--- 1. Bitset / Inverted Node Indexing ---');
const eastleighNodeId = 'node_eastleigh_20km';
const eligibleEastleigh = supplyNodeBitmapIndex.getEligibleProductIdsForNode(eastleighNodeId);
assert(eligibleEastleigh.size > 0, `Eastleigh supply node has active product bitset (${eligibleEastleigh.size} SKUs)`);

const stats = supplyNodeBitmapIndex.getStats();
assert(stats.totalNodesIndexed >= 3, `Bitmap index covers all registered nodes (${stats.totalNodesIndexed} nodes)`);
assert(stats.rootNationalCount > 0, `Universal ROOT national commodities registered in bitset (${stats.rootNationalCount} SKUs)`);

// 2. Trie / Radix Tree Instant Keystroke Autocomplete
console.log('\n--- 2. Radix Trie Instant Prefix Matching ---');
const trieResultsJog = prefixTrieInstance.searchPrefix('jog', 5);
assert(trieResultsJog.length > 0, `Prefix "jog" returns immediate matches via Radix Trie (${trieResultsJog.length} results)`);
assert(trieResultsJog[0].query.toLowerCase().includes('jogoo'), `Top candidate for "jog" matches Jogoo: "${trieResultsJog[0].title}"`);

const trieResultsSheng = prefixTrieInstance.searchPrefix('njug', 3);
assert(trieResultsSheng.length > 0, `Prefix "njug" returns Sheng match for roasted peanuts`);

const autocompleteOutput = getAutocompleteSuggestions('jog');
assert(autocompleteOutput.length > 0, `getAutocompleteSuggestions resolves candidates via Trie`);

// 3. Hierarchical Radius Bounding Box (AABB) vs Haversine
console.log('\n--- 3. AABB Bounding Box vs Haversine Geometry ---');
const nairobiLat = -1.2585;
const nairobiLng = 36.8834;
const box20km = calculateAABB(nairobiLat, nairobiLng, 20);

// Close point inside 20km (Eastleigh Wholesaler ~ 3km)
const isNearbyInBox = isPointInAABB(-1.2785, 36.8524, box20km);
assert(isNearbyInBox, 'AABB correctly includes nearby Eastleigh wholesaler point inside 20km box');

// Far point outside 20km (Mombasa ~ 480km)
const isFarInBox = isPointInAABB(-4.0435, 39.6682, box20km);
assert(!isFarInBox, 'AABB correctly rejects distant Mombasa coordinate (>400km)');

// 4. End-to-End Search Engine Execution & Telemetry
console.log('\n--- 4. End-to-End Search Execution & Tree Pruning Verification ---');
const searchResult = executeWaynoSearch('unga wa ugali 2kg bale', {
  userLat: nairobiLat,
  userLng: nairobiLng,
  shopId: 'shop_01',
});

assert(searchResult.results.length > 0, `Search returns valid results for "unga wa ugali 2kg bale" (${searchResult.results.length} hits)`);
assert(Boolean(searchResult.indexMetrics), 'Search result contains InvertedIndexMetrics');
assert(searchResult.indexMetrics!.treePrunedCount !== undefined, `Telemetry records treePrunedCount (${searchResult.indexMetrics!.treePrunedCount} SKUs pruned)`);
assert(searchResult.indexMetrics!.aabbGeoEvaluated !== undefined, `Telemetry records aabbGeoEvaluated (${searchResult.indexMetrics!.aabbGeoEvaluated} evaluations)`);
assert(searchResult.indexMetrics!.activeSupplyNodeId !== undefined, `Telemetry identifies active node: ${searchResult.indexMetrics!.activeSupplyNodeId}`);

// 5. Verification of Local Commodity vs National Product Hierarchy
console.log('\n--- 5. Local Commodity (20km) vs National Scope Verification ---');
// Soko Supreme Maize Meal 2kg (Local Commodity)
const sokoProduct = PRODUCTS.find((p) => p.name.toLowerCase().includes('soko supreme'));
if (sokoProduct) {
  const eligibility = geoEngine.evaluateShopNodeEligibility({ lat: nairobiLat, lng: nairobiLng }, sokoProduct);
  assert(eligibility.isEligible, 'Soko Supreme 2kg is eligible for shop within active local node corridor');
  assert(eligibility.productNodeLevel === 'LOCAL_NODE', 'Soko Supreme is classified under LOCAL_NODE hierarchy');
}

// National product (ROOT)
const nationalProduct = PRODUCTS.find((p) => p.supplyNodeLevel === 'ROOT');
if (nationalProduct) {
  const eligibility = geoEngine.evaluateShopNodeEligibility({ lat: -0.0917, lng: 34.7680 }, nationalProduct); // Kisumu shop
  assert(eligibility.isEligible, `National product "${nationalProduct.name}" is accessible across all nodes (Kisumu shop eligible)`);
}

console.log('\n================================================================');
console.log(`PRODUCTION TEST SUITE SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
}
