# Wayno Search Service

High-speed search service engineered specifically for Kenyan FMCG retail ordering.

## Specifications Implemented
- **Sub-50ms P50 Latency**: In-memory inverted index and vector embedding retrieval.
- **Sheng & Swahili Phonetic Normalizer**: Translates colloquial terms (e.g., `unga`, `chapo flour`, `ndovu`, `sukari`) into structured SKU queries.
- **Pack Size Disambiguation**: Intelligently categorizes pack variants (1kg, 2kg, 12x2kg bale, 24x500ml carton).
- **Fuzzy Typo Tolerance**: Levenshtein distance matching with n-gram tokenization.
