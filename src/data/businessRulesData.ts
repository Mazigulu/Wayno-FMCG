import { BusinessRuleSpec } from '../types/businessRules';

export const DETAILED_BUSINESS_RULES: BusinessRuleSpec[] = [
  // 1. HOW SUPPLIER SELECTION WORKS
  {
    id: 'rule_01_supplier_selection',
    ruleNumber: 1,
    category: 'FULFILLMENT_OPERATIONS',
    title: 'How Supplier Selection Works (Zero-Touch Retailer Sourcing)',
    summary: 'Automated multi-factor candidate scoring and order routing algorithm determining the optimal wholesale depot for each item or basket. The retailer is never involved in choosing wholesalers; Wayno automatically sources the best rate and dispatches delivery.',
    businessObjective: 'Eliminates order friction, vendor negotiation overhead, and split delivery costs by shielding duka shopkeepers from wholesale depot selection. Wayno autonomously matches baskets to the optimal wholesaler based on price, proximity, stock reliability, and delivery speed.',
    keyFormulasOrParameters: [
      { label: 'Composite Scoring Formula', value: 'Score = (DistanceScore × 0.30) + (PriceScore × 0.25) + (StockCertainty × 0.20) + (Reliability × 0.15) + (PrepSpeed × 0.10)' },
      { label: 'Basket Consolidation Bonus', value: '+15 points if the wholesaler already stocks other items in the active basket' },
      { label: 'Safety Stock Buffer', value: 'Stock Qty must exceed required quantity by at least +2 units or 10% to prevent ghost inventory locks' },
      { label: 'Tie-Breaking Rule', value: 'If two wholesalers are within 2.0 composite points, preference is given to the depot with higher historical on-time dispatch rate' },
    ],
    stepByStepProtocol: [
      '1. Ingestion: Retailer adds items to cart or executes a wholesale checkout.',
      '2. Candidate Filtering: The engine queries all active depots in the retailer’s authorized service zone that have stock availability > 0.',
      '3. Factor Normalization: Distance (km via Haversine), Wholesale Price (KES), Available Inventory, Fill-rate Reliability (%), and Prep Time (mins) are normalized on a 0-100 scale.',
      '4. Basket Affinity Optimization: Evaluates whether splitting across multiple suppliers is commercially justified vs consolidating at a single depot with +15 basket consolidation points.',
      '5. Winning Wholesaler Assignment: Order is allocated to the top-scoring depot and transmitted with a 4-minute acceptance timer.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Single item available at only one depot across all of Nairobi',
        resolution: 'Bypasses multi-factor weighting and directly allocates to the sole stocking depot, applying an inter-zone transit warning if distance > 7km.',
      },
      {
        scenario: 'All candidate depots report 0 stock during real-time checkout verification',
        resolution: 'Engages Rule 11 (Out-of-Stock Recovery) and offers immediate pre-checkout FMCG staple substitutes or triggers backorder notification.',
      },
      {
        scenario: 'Split basket tradeoff (Cheaper split vs single combined delivery)',
        resolution: 'The engine compares: (Savings on Item Prices) vs (Extra Second-Rider Delivery Fee). If net savings < KES 80, the single consolidated wholesaler is preferred.',
      },
    ],
    kenyanMarketContext: 'In Nairobi FMCG trade, prices can vary between Eastleigh (Somlink corridor) and Industrial Area (Enterprise Rd) by KES 20-50 per bale of flour. Balancing delivery distance against price differences prevents shopkeepers from paying more in boda fees than they save on wholesale goods.',
    slaOrThresholds: [
      { metric: 'Supplier Selection Latency', target: '< 15 ms', penaltyOrAction: 'Algorithmic timeout defaults to nearest depot' },
      { metric: 'Inventory Confidence Threshold', target: '≥ 95% certainty', penaltyOrAction: 'Auto-deprioritizes depots with recent stock variance flags' },
    ],
    interactiveType: 'SUPPLIER_SELECTION',
  },

  // 2. HOW PRICES WORK
  {
    id: 'rule_02_how_prices_work',
    ruleNumber: 2,
    category: 'PRICING_FEES',
    title: 'How Prices Work & Tier Rules',
    summary: 'Wholesale B2B transparent dynamic pricing with price-lock guarantees, volume tier brackets, and real-time retailer profit margin calculation.',
    businessObjective: 'Empowers duka shopkeepers with transparent cost bases, guaranteed locked checkout prices, and exact calculation of their gross resale margin against official Kenyan RRP.',
    keyFormulasOrParameters: [
      { label: 'Retailer Gross Profit Margin', value: 'Margin (KES) = Recommended Retail Price (RRP) - Wholesale Purchase Price' },
      { label: 'Margin Percentage', value: 'Margin % = (Margin KES / RRP) × 100' },
      { label: 'Price Lock Window', value: '15 Minutes guaranteed lock upon transitioning to PAYMENT_PENDING' },
      { label: 'Bulk Volume Tiers', value: 'Tier 1: 1-4 units (Standard Wholesale) | Tier 2: 5-9 units (-2.5% discount) | Tier 3: 10+ units (-5.0% discount)' },
    ],
    stepByStepProtocol: [
      '1. Dynamic Wholesaler Rate Ingestion: Wholesalers update price lists via API or portal; updates apply immediately to new search queries and cart additions.',
      '2. Cart Lock-in: When a retailer proceeds to M-Pesa payment, prices are frozen for 15 minutes to insulate the duka owner from intra-day commodity swings.',
      '3. Volume Discount Application: If order quantity satisfies volume tier thresholds (e.g., 5 bales of unga), discount is automatically deducted as a separate line item.',
      '4. Margin Display: Every product card dynamically computes the shopkeeper’s potential profit if resold at consumer MSRP.',
      '5. Settlement Reconciliation: Wholesaler receives their stated wholesale price minus WAYNO platform facilitation fee (1.5% - 2.5%).',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Wholesaler increases price while retailer is completing M-Pesa STK push',
        resolution: 'The 15-minute price lock honors the original lower price; WAYNO absorbs the differential variance if under KES 50, or alerts the wholesaler of lock policy.',
      },
      {
        scenario: 'Extreme commodity price crash (e.g., Cooking Oil drop of KES 200/jerrycan mid-day)',
        resolution: 'Retailer receives a prompt if the price dropped in their favor before payment confirmation, automatically upgrading them to the cheaper rate.',
      },
    ],
    kenyanMarketContext: 'Informal duka owners operate on tight 8% - 15% margins. Clarity on resale profitability against supermarket prices (Carrefour, Naivas) and open-air markets gives them competitive pricing power.',
    slaOrThresholds: [
      { metric: 'Price Lock Duration', target: '15:00 minutes', penaltyOrAction: 'Unpaid carts release locks and refresh to live catalog price' },
      { metric: 'Price Update Propagation', target: '< 2.0 seconds', penaltyOrAction: 'System cache invalidation on price webhook' },
    ],
    interactiveType: 'GENERIC',
  },

  // 3. DELIVERY-FEE CALCULATION
  {
    id: 'rule_03_delivery_fee',
    ruleNumber: 3,
    category: 'PRICING_FEES',
    title: 'Delivery-Fee Calculation',
    summary: 'Mathematically bounded delivery fee model balancing base boarding charge, per-kilometer distance tiers, bulk weight surcharges, and weather/traffic surge.',
    businessObjective: 'Compensates boda boda and cargo riders fairly while keeping delivery affordable for micro-retailers ordering daily stock.',
    keyFormulasOrParameters: [
      { label: 'Master Delivery Formula', value: 'DeliveryFee = [BaseFee + (DistRate × max(0, dist - 3.0km)) + (WeightRate × max(0, weight - 30kg))] × SurgeMultiplier + ExpressFee - Discounts' },
      { label: 'Base Delivery Fee', value: 'KES 150 (Includes initial 3.0 km distance and up to 30 kg cargo payload)' },
      { label: 'Incremental Distance Rate', value: 'KES 35 per kilometer beyond the initial 3.0 km baseline' },
      { label: 'Heavy Cargo Surcharge', value: 'KES 5 per kg for payload between 30kg and 60kg; automatically upgrades to Tuk-Tuk (+KES 250 flat) for loads > 60kg' },
      { label: 'Surge Multiplier', value: '1.0x (Normal) | 1.15x (Evening Rush Hour 17:00-19:30) | 1.25x (Heavy Nairobi Flash Flood/Rain)' },
      { label: 'Free Delivery Threshold', value: 'Orders over KES 25,000 receive 100% free delivery subsidy within 5.0 km radius' },
    ],
    stepByStepProtocol: [
      '1. GPS Coordinate Calculation: Calculates precise road distance in km from Wholesaler Depot coordinates to Retailer Duka coordinates using Haversine with 1.28x urban routing tortuosity factor.',
      '2. Weight Aggregation: Sums the total metric weight of all items in the basket (e.g., 2 bales of unga @ 24kg each = 48kg).',
      '3. Vehicle Classification: If weight ≤ 30kg, assigns standard Boda Boda; if 30-60kg, assigns Heavy-Duty Boda with cargo rack; if > 60kg, assigns Tuk-Tuk Cargo.',
      '4. Surge & Weather Check: Queries real-time Nairobi meteorological API and peak traffic hour rules to establish Surge Multiplier.',
      '5. Net Fee Computation: Deducts multi-drop discounts or free delivery subsidies and outputs final transparent KES delivery fee on checkout screen.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Retailer is located on an unpaved or inaccessible informal settlement alley (e.g., deep inside Kawangware or Mathare)',
        resolution: 'Rider parks at designated landmark (e.g. stage or chief’s camp); no extra fee charged if within 150m walking drop-off.',
      },
      {
        scenario: 'Extreme distance request (> 12km across Nairobi county)',
        resolution: 'Rejected by Rule 14 (Service-Zone Rules) unless authorized by manual Operations console dispatch with KES 450 long-haul fee.',
      },
    ],
    kenyanMarketContext: 'In Nairobi, standard passenger boda fares run KES 50-100 for short hops. A cargo boda carrying 40kg of cooking oil and sugar requires secure strapping, justifying the KES 150 base rate and fair rider compensation of 80% net payout.',
    slaOrThresholds: [
      { metric: 'Maximum Delivery Fee Cap', target: 'KES 650', penaltyOrAction: 'Any excess is subsidized by WAYNO logistics fund' },
      { metric: 'Rider Payout Share', target: '≥ 80% of gross fee', penaltyOrAction: 'Direct disbursement to rider M-Pesa wallet upon OTP delivery' },
    ],
    interactiveType: 'DELIVERY_CALCULATOR',
  },

  // 4. MINIMUM ORDER RULES
  {
    id: 'rule_04_minimum_order_rules',
    ruleNumber: 4,
    category: 'ORDER_LIFECYCLE',
    title: 'Minimum Order Rules & Packaging Units',
    summary: 'Enforces transaction viability thresholds to prevent sub-economic dispatches and ensure orders conform to wholesale packaging units.',
    businessObjective: 'Protects the unit economics of boda logistics and wholesaler warehouse handling costs while keeping entry thresholds attainable for small kiosks.',
    keyFormulasOrParameters: [
      { label: 'Basket Minimum Order Value (MOV)', value: 'KES 1,500 across all Nairobi operational zones' },
      { label: 'Per-Wholesaler Minimum (Multi-depot)', value: 'KES 1,000 per distinct wholesaler in split orders' },
      { label: 'Small-Order Surcharge', value: 'KES 100 optional convenience fee if basket is between KES 1,000 and KES 1,499' },
      { label: 'Wholesale Packaging Unit Mandate', value: 'Orders must be placed in original B2B units (Bales, Cartons, Crates, 5L/10L/20L Jerricans); broken loose packets strictly prohibited' },
    ],
    stepByStepProtocol: [
      '1. Basket Evaluation: Upon clicking "Proceed to Checkout", the system validates basket subtotal against KES 1,500 MOV.',
      '2. Sub-threshold Handling: If subtotal < KES 1,500, user is prompted with intelligent high-velocity impulse add-ons (e.g., "Add 1 carton of Njugu or 1 crate of Royco cubes to reach free delivery").',
      '3. Small-Order Fee Option: If basket is between KES 1,000 - 1,499, retailer can elect to pay the KES 100 small-order handling fee or add more stock.',
      '4. Sub-KES 1,000 hard block: Baskets under KES 1,000 cannot proceed under any circumstances.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Retailer attempts to buy 1 single packet of 2kg Jogoo flour (retail unit) instead of a 12-packet wholesale bale',
        resolution: 'The UI restricts quantity selector to wholesale increments only (1 bale = 12 packets, 2 bales = 24 packets).',
      },
      {
        scenario: 'First-time duka onboarding trial order',
        resolution: 'First order waiver: New duka owners receive a one-time MOV waiver down to KES 800 with free delivery subsidized by WAYNO growth team.',
      },
    ],
    kenyanMarketContext: 'Wholesale depots in Eastleigh and Gikomba refuse to break bales because counting loose packets slows warehouse fulfillment and causes packaging tears. WAYNO standardizes on authentic wholesale packaging.',
    slaOrThresholds: [
      { metric: 'Minimum Order Value', target: 'KES 1,500', penaltyOrAction: 'Hard checkout block unless KES 100 surcharge accepted' },
    ],
    interactiveType: 'GENERIC',
  },

  // 5. SUPPLIER ACCEPTANCE TIMEOUTS
  {
    id: 'rule_05_supplier_acceptance_timeouts',
    ruleNumber: 5,
    category: 'FULFILLMENT_OPERATIONS',
    title: 'Supplier Acceptance Timeouts & Failover',
    summary: 'Strict 4-minute acceptance SLA ladder with progressive alerts and automatic failover rerouting if a wholesaler fails to confirm an order.',
    businessObjective: 'Eliminates order stagnation and ensures fast turnaround so duka retailers are not left waiting with locked working capital.',
    keyFormulasOrParameters: [
      { label: 'Hard Acceptance Timeout', value: '4 Minutes (240 Seconds) from PAID timestamp' },
      { label: 'Escalation Ladder', value: 'T=0s: App notification & SMS | T=120s: Urgent audio chime & IVR prompt | T=240s: Hard timeout & penalty' },
      { label: 'Wholesaler Reliability Penalty', value: '-1.5% deducted from Wholesaler Reliability Score for every expired timeout' },
      { label: 'Failover Reroute Target', value: 'Secondary best-ranked depot in same service zone' },
    ],
    stepByStepProtocol: [
      '1. Order Paid: Retailer completes M-Pesa payment; order transitions to FULFILLMENT_PENDING.',
      '2. Timer Initialization: A 240-second countdown is displayed on Wholesaler Portal and dispatched via Webhook / Push / SMS.',
      '3. Mid-Point Escalation (T = 120s): If unconfirmed, secondary audio alert sounds on depot tablet, and automated WhatsApp alert pings warehouse manager.',
      '4. Hard Expiry (T = 240s): Wholesaler portal auto-locks the order; order state transitions to SUPPLIER_TIMED_OUT.',
      '5. Dynamic Failover: System automatically queries candidate #2. If candidate #2 exists and price variance ≤ 3%, order auto-reroutes without retailer friction.',
      '6. Full Auto-Refund: If no secondary supplier has stock, order is cancelled and Safaricom Daraja B2C instant refund dispatches within 90 seconds.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Wholesaler clicks "Accept" at second 239 while failover routine is initiating',
        resolution: 'Distributed redis lock guarantees atomic confirmation; wholesaler acceptance wins if committed before T=240.000s.',
      },
      {
        scenario: 'Secondary wholesaler has a higher price (e.g. +KES 50)',
        resolution: 'WAYNO subsidizes the KES 50 difference from platform reserve to honor the retailer’s confirmed price.',
      },
    ],
    kenyanMarketContext: 'Busy depot counters in Nairobi frequently experience power outages or chaotic morning truck unloads. Automated timeouts prevent orders from falling into a black hole.',
    slaOrThresholds: [
      { metric: 'Supplier Acceptance SLA', target: '< 4 minutes', penaltyOrAction: 'Automatic reroute + -1.5 reliability penalty' },
      { metric: 'Failover Reroute Speed', target: '< 5 seconds', penaltyOrAction: 'Immediate failover execution' },
    ],
    interactiveType: 'TIMEOUT_SIMULATOR',
  },

  // 6. SUBSTITUTIONS
  {
    id: 'rule_06_substitutions',
    ruleNumber: 6,
    category: 'FULFILLMENT_OPERATIONS',
    title: 'Substitutions Policy & Price Adjustments',
    summary: 'Structured substitution framework governing permissible product swaps, retailer approval workflows, and automated M-Pesa price differentials.',
    businessObjective: 'Preserves order fulfillment when a specific brand SKU is unavailable while respecting brand loyalty and retail customer preferences.',
    keyFormulasOrParameters: [
      { label: 'Price Tolerance Band', value: 'Substitute price must be within ±3.0% of original item wholesale cost' },
      { label: 'Retailer Decision Window', value: '180 Seconds (3 minutes) to accept or decline substitution via SMS / App' },
      { label: 'Cheaper Substitute Rule', value: '100% of price difference refunded instantly to retailer M-Pesa' },
      { label: 'Pricier Substitute Rule', value: 'If substitute is 0% to +3% higher, WAYNO absorbs the difference as a fulfillment guarantee' },
    ],
    stepByStepProtocol: [
      '1. Wholesaler Discrepancy Flag: Wholesaler marks item unavailable during packing and selects from pre-approved brand equivalent matrix (e.g., Soko 2kg for Jogoo 2kg, or Pwani Fresh Fri for Menengai Top Fry).',
      '2. Policy Engine Verification: Validates brand tier equivalence (Premium vs Economy) and verifies price tolerance band (≤ 3%).',
      '3. Retailer Preference Execution:',
      '   - If retailer profile is AUTO_SUBSTITUTE: Swap is approved immediately and logged in invoice.',
      '   - If retailer profile is CONFIRM_REQUIRED: Push prompt and SMS sent with 180s countdown.',
      '4. Financial Adjustment: Ledger computes variance. If substitute is cheaper, instant M-Pesa reversal fires for the difference; if substitute is more expensive, platform warranty absorbs cost.',
      '5. Rejection Flow: If retailer rejects or timer expires, item is dropped and processed under Rule 7 (Partial Fulfillment).',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Proposed substitute is completely different category or economy grade (e.g. Bar soap for Omo detergent)',
        resolution: 'Strictly prohibited by catalog policy; system blocks cross-category substitutions.',
      },
      {
        scenario: 'Retailer has SMS-only feature phone (no smartphone app)',
        resolution: 'Interactive SMS sent: "Reply 1 to accept Soko Flour at KES 1,820, Reply 2 to refund KES 1,850".',
      },
    ],
    kenyanMarketContext: 'In Kenyan dukas, consumers are brand conscious about maize flour (Jogoo vs Soko vs Pembe). A duka owner in Kariobangi knows if their customers accept Soko as an alternative; giving them control protects their retail customer trust.',
    slaOrThresholds: [
      { metric: 'Retailer Response Window', target: '180 seconds', penaltyOrAction: 'Defaults to item drop & refund if no response' },
      { metric: 'Allowed Price Variance', target: '≤ ±3.0%', penaltyOrAction: 'Out-of-bound substitutes automatically rejected' },
    ],
    interactiveType: 'SUBSTITUTION_PARTIAL',
  },

  // 7. PARTIAL FULFILLMENT
  {
    id: 'rule_07_partial_fulfillment',
    ruleNumber: 7,
    category: 'ORDER_LIFECYCLE',
    title: 'Partial Fulfillment & Line-Item Rebalancing',
    summary: 'Governs order continuation when a wholesaler can fulfill some, but not all, items or quantities in a paid order.',
    businessObjective: 'Prevents total order cancellation when critical fast-movers can still be delivered, minimizing stockouts for the shopkeeper.',
    keyFormulasOrParameters: [
      { label: 'Minimum Fulfillment Threshold', value: 'At least 60% of total order value must be fulfillable to permit partial shipment' },
      { label: 'Delivery Fee Pro-ration', value: 'Delivery fee is recalculated based on reduced cargo weight tier; difference refunded if weight drops below 30kg' },
      { label: 'Partial State Machine', value: 'FULFILLMENT_PENDING -> PARTIALLY_FULFILLED -> READY_FOR_PICKUP' },
      { label: 'Instant Refund SLA', value: '< 90 seconds from partial confirmation to M-Pesa B2C credit' },
    ],
    stepByStepProtocol: [
      '1. Shortage Identification: Depot packer inputs available quantities (e.g., ordered 5 bales of Jogoo, only 3 available in inventory).',
      '2. 60% Viability Check: System checks if remaining value ≥ 60% of original subtotal. If < 60%, partial fulfillment is disallowed and order fails over to alternate supplier or full refund.',
      '3. Retailer Notification: Automated SMS/App notification informs duka owner: "Order #... partially fulfilled: 3/5 bales available. KES 3,640 refunded to your M-Pesa immediately."',
      '4. Ledger Rebalancing: Order subtotal and weight are recalculated. Safaricom B2C API triggers refund for unfulfilled items.',
      '5. Dispatch: Order transitions to PARTIALLY_FULFILLED and dispatches to nearest boda rider for immediate pickup.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'The single most important anchor item in the order is missing (e.g. 10 bales of flour missing, only small spices available)',
        resolution: 'Anchor Item Rule: If any single item representing > 50% of basket value is 0% fulfilled, partial fulfillment requires explicit retailer confirmation.',
      },
    ],
    kenyanMarketContext: 'Duka owners often order urgent flour + secondary snacks together. If the flour is ready, they desperately want the flour delivered before evening cooking hours, even if snacks are refunded.',
    slaOrThresholds: [
      { metric: 'Minimum Value Threshold', target: '≥ 60% fulfillable', penaltyOrAction: 'Below 60% triggers automatic full order reroute' },
      { metric: 'Refund Trigger Speed', target: '< 90 seconds', penaltyOrAction: 'Automated queue retry with escalation to finance on-call' },
    ],
    interactiveType: 'SUBSTITUTION_PARTIAL',
  },

  // 8. REFUNDS
  {
    id: 'rule_08_refunds',
    ruleNumber: 8,
    category: 'ORDER_LIFECYCLE',
    title: 'Refunds & M-Pesa Settlement Ledger',
    summary: 'Automated, real-time reversal and B2C refund protocols integrated directly with Safaricom Daraja M-Pesa API.',
    businessObjective: 'Builds absolute trust with micro-retailers who cannot afford to have working capital trapped in platform disputes or multi-day banking delays.',
    keyFormulasOrParameters: [
      { label: 'Refund Method', value: 'Direct Safaricom Daraja M-Pesa B2C reversal to the initiating phone number' },
      { label: 'Refund Processing SLA', value: '< 90 Seconds for automated system triggers; < 15 Minutes for customer-support disputes' },
      { label: 'Full Refund Formula', value: '100% Subtotal + 100% Delivery Fee + 100% Surcharges (Supplier fault, timeout, or cancellation before pickup)' },
      { label: 'Partial Refund Formula', value: 'Exact line-item value unfulfilled + any downward delivery weight tier differential' },
    ],
    stepByStepProtocol: [
      '1. Trigger Event: Initiated by cancellation, partial fulfillment, supplier timeout, or approved return.',
      '2. Amount Calculation: Rules engine computes exact refund amount down to 1 KES.',
      '3. Idempotency Key Generation: Generates unique UUID key (e.g., ref_mpesa_ord01_item02_timestamp) to prevent double refunds.',
      '4. Daraja B2C Call: Dispatches API request to Safaricom Daraja B2C endpoint with merchant utility account credentials.',
      '5. Webhook Confirmation: Listens for ResultCode: 0 (Success) and stores provider reference code (e.g., QH918231KE) in order audit trail.',
      '6. Telemetry & Receipt: Retailer receives official Safaricom M-Pesa SMS and WAYNO in-app refund receipt.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Retailer’s M-Pesa account is over daily limit or suspended by telco',
        resolution: 'Daraja returns error; WAYNO automatically credits in-app Duka Float Wallet and alerts retailer via SMS.',
      },
      {
        scenario: 'Safaricom Daraja API maintenance outage',
        resolution: 'Refund request enters guaranteed retry queue (backoff 30s, 60s, 120s); SMS notifies retailer that funds will reflect upon Safaricom link restoration.',
      },
    ],
    kenyanMarketContext: 'Working capital in Kenyan dukas is measured in thousands of shillings, not millions. A shopkeeper with KES 10,000 capital cannot buy stock from another vendor until their KES 3,000 refund lands back in their M-Pesa account.',
    slaOrThresholds: [
      { metric: 'Automated Refund Latency', target: '< 90 seconds', penaltyOrAction: 'Escalates to High-Priority Finance Queue' },
      { metric: 'Refund Idempotency', target: '100% zero-duplicate guarantee', penaltyOrAction: 'Enforced via database unique constraint' },
    ],
    interactiveType: 'REFUND_CANCELLATION',
  },

  // 9. CANCELLATIONS
  {
    id: 'rule_09_cancellations',
    ruleNumber: 9,
    category: 'ORDER_LIFECYCLE',
    title: 'Cancellations Policy & Fee Matrix',
    summary: 'Comprehensive cancellation rules defining permissible windows, responsible party attribution, and financial penalties across all order states.',
    businessObjective: 'Permits retailer flexibility during early stages while protecting wholesalers and riders from sunk packaging and transit costs.',
    keyFormulasOrParameters: [
      { label: 'State: CREATED / PAYMENT_PENDING', value: '100% Free Cancellation by Retailer | 0 Fee | Immediate cancellation' },
      { label: 'State: PAID / FULFILLMENT_PENDING', value: '100% Free Cancellation by Retailer | 100% Full Refund (Subtotal + Delivery Fee)' },
      { label: 'State: SUPPLIER_CONFIRMED (First 2 mins)', value: 'Free cancellation before physical pallet staging begins' },
      { label: 'State: SUPPLIER_CONFIRMED (> 2 mins)', value: 'KES 100 Restocking Fee deducted if goods already packed onto loading dock' },
      { label: 'State: RIDER_ASSIGNED / READY_FOR_PICKUP', value: 'Delivery Fee is non-refundable (transferred to Rider as dispatch compensation)' },
      { label: 'State: PICKED_UP / OUT_FOR_DELIVERY', value: 'In-app cancellation locked; must follow Rule 10 (Failed / Refused Delivery)' },
    ],
    stepByStepProtocol: [
      '1. Cancellation Request: User or system taps "Cancel Order" with mandatory reason selection.',
      '2. State Inspection: System determines current immutable order state from ledger.',
      '3. Financial Impact Assessment: Computes whether restocking fees or rider dispatch fees must be retained.',
      '4. Notification Broadcast: Simultaneously alerts Wholesaler Portal (abort packing) and Rider Console (release order to available pool).',
      '5. M-Pesa Refund Execution: Releases net refund amount according to Rule 8.',
      '6. Telemetry Logging: Order marked CANCELLED with actor attribution (RETAILER, WHOLESALER, SYSTEM, ADMIN).',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Wholesaler initiates cancellation due to sudden warehouse power outage or depot flood',
        resolution: 'Retailer receives 100% full refund + KES 150 goodwill voucher; wholesaler receives a reliability demerit.',
      },
    ],
    kenyanMarketContext: 'Boda riders burn expensive fuel navigating Nairobi traffic. If a rider arrives at Eastleigh depot and the duka cancels, paying the rider their base dispatch fee ensures rider retention and morale.',
    slaOrThresholds: [
      { metric: 'Cancellation Confirmation', target: '< 3 seconds', penaltyOrAction: 'Instant state transition and notification' },
    ],
    interactiveType: 'REFUND_CANCELLATION',
  },

  // 10. FAILED DELIVERIES
  {
    id: 'rule_10_failed_deliveries',
    ruleNumber: 10,
    category: 'LOGISTICS_ROUTING',
    title: 'Failed Deliveries & Return-to-Depot Protocol',
    summary: 'Standardized 8-minute arrival protocol, fault determination matrix, and return-to-origin logistics handling for uncompleted drops.',
    businessObjective: 'Provides an objective, fraud-proof dispute protocol when deliveries cannot be completed at the retailer duka.',
    keyFormulasOrParameters: [
      { label: 'Mandatory Rider Wait Window', value: '8 Minutes minimum wait time at shop GPS location before initiating return' },
      { label: 'Contact Attempts Mandate', value: 'Minimum 3 phone calls via masked telephony + 1 automated geofence SMS' },
      { label: 'Retailer-Fault Return Fee', value: 'KES 200 return logistics fee deducted from refund (covers rider return trip)' },
      { label: 'Rider-Fault Remedy', value: '100% full refund to retailer + KES 150 voucher + rider disciplinary review' },
    ],
    stepByStepProtocol: [
      '1. Geofence Arrival: Rider arrives within 30 meters of duka coordinates; app logs GPS timestamp.',
      '2. Contact Inability: If shop is shuttered or owner absent, rider triggers "Customer Unreachable" in Rider Console.',
      '3. Automated 8-Minute Countdown: Rider app initiates wait timer; system auto-dials shop owner and dispatches SMS: "Your WAYNO rider is outside your shop. Please meet them within 8 mins to receive order #...".',
      '4. Escalation to Operations: At minute 5, WAYNO customer support agent receives an alert to call shop owner alternate phone.',
      '5. Return Authorization: At minute 8, operations authorizes "Return to Depot". Rider is routed back to wholesale depot.',
      '6. Depot Re-intake & OTP: Wholesaler verifies goods condition and inputs Return OTP; retailer is issued net refund minus return fee.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Retailer disputes and claims rider never arrived',
        resolution: 'Resolved by GPS breadcrumb telemetry: Rider must have been within 30m of duka coordinates for the entire 8-minute wait window.',
      },
      {
        scenario: 'Perishable or damaged goods upon return',
        resolution: 'Depot manager inspects packaging; if damage occurred in rider transit, cargo insurance covers wholesaler.',
      },
    ],
    kenyanMarketContext: 'In informal settlements, shopkeepers occasionally step away to attend church, funerals, or water collection, leaving a minor or neighbor in charge. The 8-minute protocol gives them adequate time to return or send a trusted delegate with the delivery OTP.',
    slaOrThresholds: [
      { metric: 'Rider Wait Time', target: '≥ 8 minutes', penaltyOrAction: 'Early departure invalidates return fee compensation' },
      { metric: 'Return-to-Depot Turnaround', target: '< 45 minutes', penaltyOrAction: 'Rider tracked on live GPS return route' },
    ],
    interactiveType: 'GENERIC',
  },

  // 11. OUT-OF-STOCK PRODUCTS
  {
    id: 'rule_11_out_of_stock',
    ruleNumber: 11,
    category: 'FULFILLMENT_OPERATIONS',
    title: 'Out-of-Stock Management & Inventory Variance',
    summary: 'Proactive catalog guards preventing checkout of zero-stock items, paired with immediate variance handling when depot inventory drifts.',
    businessObjective: 'Minimizes zero-result and cancelled order friction by maintaining live synchronization between physical warehouse piles and app catalogs.',
    keyFormulasOrParameters: [
      { label: 'Ghost Stock Quarantine', value: 'SKU automatically delisted within 500ms when physical stock reaches zero' },
      { label: 'Discrepancy Strike Policy', value: 'Wholesalers with > 3 stockout cancellations per week face temporary catalog ranking demotion (-10 pts)' },
      { label: 'Zero-Result Demand Logger', value: 'Searches for out-of-stock items log a demand gap signal alerting regional wholesalers' },
    ],
    stepByStepProtocol: [
      '1. Real-Time Deduction: When an order is confirmed, wholesaler inventory decrements atomically.',
      '2. Threshold Alarm: When depot inventory reaches ≤ 5 bales, wholesaler receives a replenishment alert.',
      '3. Physical Audit Variance: If a warehouse packer discovers physical bags are damaged or missing: packer clicks "Stock Discrepancy" on Wholesaler Portal.',
      '4. Catalog Immediate Freeze: The SKU is instantly set to availability=false across all active user search sessions.',
      '5. Active Order Resolution: If affected order is in progress, engages Rule 6 (Substitutions) or Rule 7 (Partial Fulfillment).',
      '6. Telemetry Strike: Discrepancy logged against wholesaler reliability scorecard.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'High-velocity run on unga during national price subsidy announcement',
        resolution: 'Rate-limiting locks: Inventory reservations hold item for 5 minutes during checkout to prevent over-selling.',
      },
    ],
    kenyanMarketContext: 'Informal wholesale warehouses often run manual paper ledgers alongside digital tools. Physical theft, bag punctures, and counting errors occur. Fast automated delisting prevents cascades of broken orders.',
    slaOrThresholds: [
      { metric: 'Catalog Delist Latency', target: '< 500 ms', penaltyOrAction: 'Instant Redis cache eviction' },
      { metric: 'Inventory Accuracy SLA', target: '≥ 98.0%', penaltyOrAction: 'Wholesalers below 95% penalized in search ranking' },
    ],
    interactiveType: 'GENERIC',
  },

  // 12. MULTIPLE SUPPLIER ORDERS
  {
    id: 'rule_12_multiple_supplier_orders',
    ruleNumber: 12,
    category: 'LOGISTICS_ROUTING',
    title: 'Multiple Supplier Orders (Split Orders)',
    summary: 'Decomposes multi-wholesaler shopping baskets into synchronized sub-orders with optimized sequential or parallel rider dispatch.',
    businessObjective: 'Allows duka owners to source all required categories in a single transaction without being constrained to what a single wholesaler stocks.',
    keyFormulasOrParameters: [
      { label: 'Order Decomposition Format', value: 'Parent Order ORD-8924 -> Sub-Order ORD-8924-A (Depot 1) + ORD-8924-B (Depot 2)' },
      { label: 'Bundled Multi-Drop Discount', value: '20% discount applied to secondary delivery leg if serviced sequentially by a single rider' },
      { label: 'Routing Decision Radius', value: 'If Depots are ≤ 2.5km apart: Single Rider Sequential Pickup | If > 2.5km apart: Parallel Dual Rider Dispatch' },
      { label: 'Unified Retailer View', value: 'Single composite invoice with individual real-time progress bars for each sub-order' },
    ],
    stepByStepProtocol: [
      '1. Cart Decomposition: At checkout, items are grouped by wholesaler location ID.',
      '2. Distance & Feasibility Check: Haversine calculates depot-to-depot distance. If depots are close (≤ 2.5km) and combined weight ≤ 35kg, system elects Single-Rider Sequential Route.',
      '3. Parallel Dispatch (if distant): If depots are far or total weight > 40kg, two distinct riders are booked simultaneously.',
      '4. Independent Sub-Order Life: Each wholesaler gets their own 4-minute acceptance timer and pickup OTP.',
      '5. Synchronized Delivery: Retailer app displays tracking cards for Sub-Order A and Sub-Order B with individual ETAs.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'One wholesaler accepts, but the other wholesaler times out or rejects',
        resolution: 'Accepted sub-order proceeds to delivery normally; rejected sub-order triggers Rule 5 failover without impacting the accepted leg.',
      },
    ],
    kenyanMarketContext: 'Duka owners frequently buy dry grains from Eastleigh traders (Somlink) and soap/cooking oil from Industrial Area distributors. Enabling seamless split orders saves them hours of separate phone calls.',
    slaOrThresholds: [
      { metric: 'Order Decomposition Speed', target: '< 25 ms', penaltyOrAction: 'Atomic database transaction across sub-orders' },
      { metric: 'Sequential Delivery Gap', target: '< 15 mins apart', penaltyOrAction: 'Prioritizes parallel dispatch if delay exceeds 15m' },
    ],
    interactiveType: 'GENERIC',
  },

  // 13. RIDER REASSIGNMENT
  {
    id: 'rule_13_rider_reassignment',
    ruleNumber: 13,
    category: 'LOGISTICS_ROUTING',
    title: 'Rider Reassignment & Rescue Protocol',
    summary: 'Autonomous monitoring and emergency re-allocation of orders when an assigned rider stalls, breaks down, or gets delayed.',
    businessObjective: 'Protects the end-to-end 30-minute delivery SLA from individual rider breakdowns or street disruptions.',
    keyFormulasOrParameters: [
      { label: 'Inactivity Stalling Threshold', value: '5 Minutes without GPS movement towards depot after accepting assignment' },
      { label: 'Depot Wait Ceiling', value: '15 Minutes maximum wait at depot loading dock before rider can request free release' },
      { label: 'Emergency Transfer Window', value: '< 60 Seconds to reassign to secondary rider within 1.5km radius' },
      { label: 'OTP Invalidation Mandate', value: 'Old pickup OTP immediately revoked; new cryptographic OTP generated for new rider' },
    ],
    stepByStepProtocol: [
      '1. Telemetry Sentinel: Background GPS daemon monitors rider position every 15 seconds.',
      '2. Stalling Trigger: If rider has not moved toward depot for 5 minutes, rider app triggers a priority haptic check: "Are you moving towards depot?".',
      '3. No Response (60s): If unacknowledged, system auto-unassigns rider, marks rider status OFFLINE_INVESTIGATING, and re-enters READY_FOR_PICKUP.',
      '4. Emergency Manual Button: Rider can tap "Emergency Breakdown" (punctured tire, police roadblock, engine stall).',
      '5. Candidate Re-selection: Nearest available rider within 1.5km is assigned via push broadcast.',
      '6. OTP Regeneration: New Pickup OTP sent to new rider and wholesaler depot; old OTP voided.',
      '7. Retailer Notification: Retailer ETA refreshed: "Your rider was updated to James K. (Boda KMDJ 129X) - ETA 18 mins".',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Rider breaks down AFTER picking up goods from wholesaler (en route to shop)',
        resolution: 'Rider taps "En-route Breakdown"; Operations dispatches a nearby "Rescue Rider". Goods are handed over at rider GPS location with handover OTP.',
      },
    ],
    kenyanMarketContext: 'Punctured tires (pancha) on Nairobi gravel roads and sudden police vehicle checks are everyday realities. Automated rescue protocols turn potential 2-hour disasters into 10-minute reroutes.',
    slaOrThresholds: [
      { metric: 'Stall Detection Time', target: '5 minutes', penaltyOrAction: 'Automatic unassignment and reassignment' },
      { metric: 'New Rider Dispatch SLA', target: '< 60 seconds', penaltyOrAction: 'Broadcast expands from 1.5km to 3.0km radius' },
    ],
    interactiveType: 'GENERIC',
  },

  // 14. HIERARCHICAL GEOGRAPHIC SUPPLY NETWORK & 20 KM NODE RULES
  {
    id: 'rule_14_service_zone_rules',
    ruleNumber: 14,
    category: 'LOGISTICS_ROUTING',
    title: 'Hierarchical Geographic Supply Network (20 km Nodes & Tree Topology)',
    summary: 'A hierarchical multi-tier geographic supply network where 20 km wholesaler territories form the fundamental local supply nodes, with tree-based upward escalation and dynamic rider vehicle routing.',
    businessObjective: 'Enforces local-first procurement within 20 km nodes, escalates upward only on stockouts, allows nearby cross-node escape paths, and decouples physical rider routing from static geographic circles.',
    keyFormulasOrParameters: [
      { label: 'Fundamental Node (Leaf)', value: '20 km radius circle anchored by a designated wholesale depot (e.g. NODE-NBI-01 Eastleigh, NODE-BGM-04 Bungoma)' },
      { label: 'Tree Topology (Hierarchy)', value: 'Explicit parent_zone_id relational tree: ROOT (National) -> REGION (Nairobi/Western) -> 20 km LOCAL NODES' },
      { label: 'Primary Procurement Path', value: 'Local Node First -> If unavailable -> Parent Hub -> If unavailable -> Grandparent/Root' },
      { label: 'Secondary Escape Path', value: 'Cross-Node Nearby Search: Overrides upward tree if an adjacent node wholesaler is physically closer (<10km) and stocked' },
      { label: 'Radius vs Road Network', value: '20 km Euclidean radius = initial eligibility; Actual road distance & travel time = physical feasibility' },
      { label: 'Rider Operating Mandate', value: '20 km normal operating territory cap; beyond 20 km triggers Exception Engine (Extension, Relay Handoff, or Dedicated Carrier)' },
      { label: 'Routing Architecture', value: 'Shortest Path (point-to-point) vs Vehicle Routing Problem (VRP 2-opt multi-stop sequence optimization)' },
      { label: 'Separation of Engines', value: 'Geo Engine (Where?) | Supply Engine (Who has it?) | Routing Engine (How to deliver?) | Optimization Engine (Feasible combination?)' },
    ],
    stepByStepProtocol: [
      '1. Node Anchor Assignment: Operations admin creates a wholesaler node; 20 km geographic radius defines the local supply territory.',
      '2. Shop Onboarding & Snapping: Every shop onboarded inside the 20 km radius is bound to that node as its first supply universe.',
      '3. Local-First Sourcing: When a shop requests goods (e.g., 10 bales maize flour), WAYNO queries the local anchor wholesaler first.',
      '4. Upward Escalation Traversal: If local wholesaler has stockout, system traverses upward to Parent Node in the geographic tree.',
      '5. Secondary Cross-Node Escape: Concurrently checks if an adjacent node wholesaler is closer than the parent hub; selects best feasible source.',
      '6. Vehicle Routing (VRP): For multi-shop dispatches, routing engine sequences stops (e.g., Depot -> C -> A -> D -> B -> E) rather than naive order-of-arrival, reducing fuel by ~36%.',
      '7. Out-of-Mandate Exception: Orders exceeding the rider 20 km mandate trigger (a) Route Extension fee (+KES 18/km), (b) Boundary Relay Handoff at perimeter hub, or (c) Dedicated Van dispatch.',
      '8. Machine Learning Telemetry: Node stockout and escalation rates feed procurement models to dynamically adjust wholesaler safety stock buffers.',
    ],
    edgeCasesAndExceptions: [
      {
        scenario: 'Local Node Wholesaler is stocked out, but an adjacent node wholesaler is only 8 km away across the border',
        resolution: 'Secondary Escape Path Override: WAYNO does not force upward traversal to a 35 km parent hub; it sources directly from the 8 km adjacent wholesaler with standard inter-node transit bridge fee.',
      },
      {
        scenario: 'Order destination is 28 km away (exceeding rider 20 km normal operating territory mandate)',
        resolution: 'Exception Engine triage: (1) Route Extension (+KES 144 extra mileage fee for rider), (2) Boundary Relay Handoff (Rider 1 hands off to Rider 2 at 20 km perimeter hub), or (3) Dedicated Tuk-Tuk/Van.',
      },
      {
        scenario: 'Multi-shop batch dispatch of 5 orders along the same transit corridor',
        resolution: 'Vehicle Routing Problem (VRP) Optimization: Computes TSP sequence based on road network and delivery windows rather than naive order sequence, saving ~35% distance.',
      },
    ],
    kenyanMarketContext: 'In Kenya, informal retail supply operates in localized clusters (Eastleigh, Industrial Area, Bungoma Town). A 20 km node anchors everyday boda logistics, while tree escalation ensures rural and peri-urban dukas never hit dead-ends when local wholesalers stock out.',
    slaOrThresholds: [
      { metric: 'Local Node In-Mandate Delivery SLA', target: '< 35 minutes', penaltyOrAction: 'KES 50 credit if exceeded due to logistics delay' },
      { metric: 'Hierarchical Sourcing Resolution', target: '< 150 ms', penaltyOrAction: 'Automatic fallback to cached nearest stocked node' },
      { metric: 'Rider Normal Territory Mandate', target: '≤ 20.0 km', penaltyOrAction: 'Triggers Out-of-Mandate Exception Engine' },
    ],
    interactiveType: 'SERVICE_ZONE',
  },
];
