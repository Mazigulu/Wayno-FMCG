/**
 * WAYNO PRODUCTION RATE LIMITING ARCHITECTURE
 * 
 * Multi-Algorithm, Tiered Rate Limiting & Abuse Prevention Engine
 * 
 * Algorithms implemented:
 * 1. Token Bucket (Bursty traffic: Search, Autocomplete, Telemetry)
 * 2. Sliding Window Counter (Temporal traffic: M-Pesa STK push, Wholesaler sync)
 * 3. Leaky Bucket (Queued backpressure: Checkout & Stock reservation)
 * 4. Penalty Box / Circuit Breaker (Quarantine for repeated abuse / Brute-force OTP attacks)
 */

export type RateLimitAlgorithm = 
  | 'TOKEN_BUCKET' 
  | 'SLIDING_WINDOW_COUNTER' 
  | 'LEAKY_BUCKET' 
  | 'PENALTY_BOX';

export type RateLimitPolicyKey = 
  | 'SEARCH_KEYSTROKE'
  | 'CHECKOUT_ORDER'
  | 'MPESA_STK_PUSH'
  | 'OTP_VERIFICATION'
  | 'RIDER_TELEMETRY'
  | 'WHOLESALER_SYNC';

export interface RateLimitPolicy {
  key: RateLimitPolicyKey;
  name: string;
  description: string;
  algorithm: RateLimitAlgorithm;
  limit: number;             // Max operations allowed in base window
  windowSec: number;         // Time window in seconds
  burstCapacity?: number;    // Max burst capacity for Token/Leaky bucket
  refillRatePerSec?: number; // Inflow rate for Token Bucket
  leakRatePerSec?: number;   // Egress rate for Leaky Bucket
  penaltyDurationSec?: number; // Quarantine lockout duration if violated
  maxViolationsBeforePenalty?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  policyKey: RateLimitPolicyKey;
  clientId: string;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSec?: number;
  algorithm: RateLimitAlgorithm;
  penaltyBoxActive: boolean;
  headers: {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    'Retry-After'?: string;
  };
  reason?: string;
  timestamp: number;
}

export interface ClientPenaltyRecord {
  clientId: string;
  policyKey: RateLimitPolicyKey;
  violationsCount: number;
  quarantinedUntil: number;
  reason: string;
}

export interface RateLimiterTelemetry {
  totalInspected: number;
  totalAllowed: number;
  totalThrottled: number;
  activePenaltiesCount: number;
  history: Array<{
    id: string;
    timestamp: number;
    clientId: string;
    policyKey: RateLimitPolicyKey;
    allowed: boolean;
    remaining: number;
    algorithm: RateLimitAlgorithm;
  }>;
}

// ----------------------------------------------------------------------------
// 1. TOKEN BUCKET IMPLEMENTATION
// ----------------------------------------------------------------------------
class TokenBucket {
  private capacity: number;
  private refillRate: number; // tokens per millisecond
  private tokens: number;
  private lastRefill: number;

  constructor(capacity: number, refillRatePerSec: number) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec / 1000;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(cost = 1): { allowed: boolean; remaining: number; resetTimeMs: number } {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens >= cost) {
      this.tokens -= cost;
      const msUntilFull = (this.capacity - this.tokens) / this.refillRate;
      return {
        allowed: true,
        remaining: Math.floor(this.tokens),
        resetTimeMs: Math.round(now + msUntilFull),
      };
    }

    const neededTokens = cost - this.tokens;
    const msToWait = neededTokens / this.refillRate;
    return {
      allowed: false,
      remaining: Math.floor(this.tokens),
      resetTimeMs: Math.round(now + msToWait),
    };
  }
}

// ----------------------------------------------------------------------------
// 2. SLIDING WINDOW COUNTER IMPLEMENTATION
// ----------------------------------------------------------------------------
class SlidingWindowCounter {
  private windowSizeMs: number;
  private limit: number;
  private currentWindowStart: number;
  private currentCount: number;
  private previousCount: number;

  constructor(limit: number, windowSec: number) {
    this.limit = limit;
    this.windowSizeMs = windowSec * 1000;
    this.currentWindowStart = Math.floor(Date.now() / this.windowSizeMs) * this.windowSizeMs;
    this.currentCount = 0;
    this.previousCount = 0;
  }

  consume(cost = 1): { allowed: boolean; remaining: number; resetTimeMs: number; estimatedCurrentRate: number } {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.windowSizeMs) * this.windowSizeMs;

    if (currentWindow !== this.currentWindowStart) {
      const windowsPassed = Math.floor((currentWindow - this.currentWindowStart) / this.windowSizeMs);
      if (windowsPassed === 1) {
        this.previousCount = this.currentCount;
      } else {
        this.previousCount = 0;
      }
      this.currentCount = 0;
      this.currentWindowStart = currentWindow;
    }

    const timePassedInCurrentWindow = now - this.currentWindowStart;
    const previousWindowWeight = 1 - (timePassedInCurrentWindow / this.windowSizeMs);
    const estimatedCount = (this.previousCount * previousWindowWeight) + this.currentCount;

    const resetTimeMs = this.currentWindowStart + this.windowSizeMs;

    if (estimatedCount + cost <= this.limit) {
      this.currentCount += cost;
      const remaining = Math.max(0, Math.floor(this.limit - (estimatedCount + cost)));
      return {
        allowed: true,
        remaining,
        resetTimeMs,
        estimatedCurrentRate: estimatedCount + cost,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTimeMs,
      estimatedCurrentRate: estimatedCount,
    };
  }
}

// ----------------------------------------------------------------------------
// 3. LEAKY BUCKET IMPLEMENTATION
// ----------------------------------------------------------------------------
class LeakyBucket {
  private capacity: number;
  private leakRate: number; // units per millisecond
  private currentWater: number;
  private lastLeakTime: number;

  constructor(capacity: number, leakRatePerSec: number) {
    this.capacity = capacity;
    this.leakRate = leakRatePerSec / 1000;
    this.currentWater = 0;
    this.lastLeakTime = Date.now();
  }

  consume(cost = 1): { allowed: boolean; remaining: number; resetTimeMs: number } {
    const now = Date.now();
    const elapsed = now - this.lastLeakTime;
    this.currentWater = Math.max(0, this.currentWater - (elapsed * this.leakRate));
    this.lastLeakTime = now;

    const resetTimeMs = Math.round(now + (this.currentWater / this.leakRate));

    if (this.currentWater + cost <= this.capacity) {
      this.currentWater += cost;
      const remaining = Math.max(0, Math.floor(this.capacity - this.currentWater));
      return {
        allowed: true,
        remaining,
        resetTimeMs: Math.round(now + (this.currentWater / this.leakRate)),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTimeMs,
    };
  }
}

// ----------------------------------------------------------------------------
// RATE LIMITING SERVICE ENGINE
// ----------------------------------------------------------------------------
export class RateLimiterService {
  private static instance: RateLimiterService;

  // Active policy configurations
  private policies: Map<RateLimitPolicyKey, RateLimitPolicy> = new Map();

  // State instances per client key
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private slidingWindows: Map<string, SlidingWindowCounter> = new Map();
  private leakyBuckets: Map<string, LeakyBucket> = new Map();

  // Penalty box (IP/Tenant quarantine)
  private penaltyBox: Map<string, ClientPenaltyRecord> = new Map();

  // Telemetry metrics
  private totalInspected = 0;
  private totalAllowed = 0;
  private totalThrottled = 0;
  private telemetryHistory: Array<{
    id: string;
    timestamp: number;
    clientId: string;
    policyKey: RateLimitPolicyKey;
    allowed: boolean;
    remaining: number;
    algorithm: RateLimitAlgorithm;
  }> = [];

  constructor() {
    this.initializeDefaultPolicies();
  }

  static getInstance(): RateLimiterService {
    if (!this.instance) {
      this.instance = new RateLimiterService();
    }
    return this.instance;
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: RateLimitPolicy[] = [
      {
        key: 'SEARCH_KEYSTROKE',
        name: 'Catalog & Autocomplete Keystrokes',
        description: 'Smooths fast duka keystrokes while preventing query flooding and cache exhaustion.',
        algorithm: 'TOKEN_BUCKET',
        limit: 45,
        windowSec: 60,
        burstCapacity: 20,
        refillRatePerSec: 1.0, // 60 tokens/min
        maxViolationsBeforePenalty: 4,
        penaltyDurationSec: 30,
      },
      {
        key: 'CHECKOUT_ORDER',
        name: 'Order Checkout & Stock Reservation',
        description: 'Leaky bucket prevents duka cart race conditions and artificial bulk hoard locks.',
        algorithm: 'LEAKY_BUCKET',
        limit: 6,
        windowSec: 60,
        burstCapacity: 3,
        leakRatePerSec: 0.1, // 1 order leaked every 10s
        maxViolationsBeforePenalty: 3,
        penaltyDurationSec: 60,
      },
      {
        key: 'MPESA_STK_PUSH',
        name: 'Safaricom Daraja STK Push Prompts',
        description: 'Sliding window counter protects telecom gateway from double-tap fees & handset lockups.',
        algorithm: 'SLIDING_WINDOW_COUNTER',
        limit: 3,
        windowSec: 60,
        maxViolationsBeforePenalty: 2,
        penaltyDurationSec: 120,
      },
      {
        key: 'OTP_VERIFICATION',
        name: 'Duka Delivery Handover PIN',
        description: 'Penalty box quarantines brute-force attempts on courier 4-digit handover codes.',
        algorithm: 'PENALTY_BOX',
        limit: 5,
        windowSec: 300, // 5 attempts per 5 mins
        maxViolationsBeforePenalty: 1, // Immediately lock out into Penalty Box on 1st excess attempt
        penaltyDurationSec: 300, // 5 min lockout
      },
      {
        key: 'RIDER_TELEMETRY',
        name: 'Motorbike GPS Beacon Pings',
        description: 'Token bucket allows high-frequency corridor GPS telemetry without server queue buildup.',
        algorithm: 'TOKEN_BUCKET',
        limit: 60,
        windowSec: 60,
        burstCapacity: 25,
        refillRatePerSec: 1.2,
        maxViolationsBeforePenalty: 5,
        penaltyDurationSec: 45,
      },
      {
        key: 'WHOLESALER_SYNC',
        name: 'Depot Stock & Pricing Master Sync',
        description: 'Sliding window throttles heavy bulk catalog re-indexing requests.',
        algorithm: 'SLIDING_WINDOW_COUNTER',
        limit: 30,
        windowSec: 60,
        maxViolationsBeforePenalty: 3,
        penaltyDurationSec: 60,
      },
    ];

    defaultPolicies.forEach((p) => this.policies.set(p.key, p));
  }

  /**
   * Main Ingress Rate Limit Decision Point
   */
  checkRateLimit(policyKey: RateLimitPolicyKey, clientId: string, cost = 1): RateLimitDecision {
    this.totalInspected++;
    const now = Date.now();
    const policy = this.policies.get(policyKey);

    if (!policy) {
      return {
        allowed: true,
        policyKey,
        clientId,
        limit: 100,
        remaining: 99,
        resetTimeMs: now + 60000,
        algorithm: 'TOKEN_BUCKET',
        penaltyBoxActive: false,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': Math.floor((now + 60000) / 1000).toString(),
        },
        timestamp: now,
      };
    }

    const stateKey = `${policyKey}::${clientId}`;

    // 1. Check Penalty Box first (Circuit Breaker / Tarpit)
    const penalty = this.penaltyBox.get(stateKey);
    if (penalty && penalty.quarantinedUntil > now) {
      const retryAfterSec = Math.max(1, Math.ceil((penalty.quarantinedUntil - now) / 1000));
      this.totalThrottled++;
      this.logTelemetry(clientId, policyKey, false, 0, 'PENALTY_BOX');

      return {
        allowed: false,
        policyKey,
        clientId,
        limit: policy.limit,
        remaining: 0,
        resetTimeMs: penalty.quarantinedUntil,
        retryAfterSec,
        algorithm: 'PENALTY_BOX',
        penaltyBoxActive: true,
        headers: {
          'X-RateLimit-Limit': policy.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(penalty.quarantinedUntil / 1000).toString(),
          'Retry-After': retryAfterSec.toString(),
        },
        reason: `Client quarantined in Penalty Box. ${penalty.reason}. Retry after ${retryAfterSec}s`,
        timestamp: now,
      };
    } else if (penalty && penalty.quarantinedUntil <= now) {
      // Penalty expired; release from quarantine
      this.penaltyBox.delete(stateKey);
    }

    // 2. Evaluate algorithm-specific limiter
    let allowed = false;
    let remaining = 0;
    let resetTimeMs = now + policy.windowSec * 1000;

    switch (policy.algorithm) {
      case 'TOKEN_BUCKET': {
        let bucket = this.tokenBuckets.get(stateKey);
        if (!bucket) {
          bucket = new TokenBucket(
            policy.burstCapacity || policy.limit,
            policy.refillRatePerSec || (policy.limit / policy.windowSec)
          );
          this.tokenBuckets.set(stateKey, bucket);
        }
        const res = bucket.consume(cost);
        allowed = res.allowed;
        remaining = res.remaining;
        resetTimeMs = res.resetTimeMs;
        break;
      }

      case 'SLIDING_WINDOW_COUNTER': {
        let sw = this.slidingWindows.get(stateKey);
        if (!sw) {
          sw = new SlidingWindowCounter(policy.limit, policy.windowSec);
          this.slidingWindows.set(stateKey, sw);
        }
        const res = sw.consume(cost);
        allowed = res.allowed;
        remaining = res.remaining;
        resetTimeMs = res.resetTimeMs;
        break;
      }

      case 'LEAKY_BUCKET': {
        let lb = this.leakyBuckets.get(stateKey);
        if (!lb) {
          lb = new LeakyBucket(
            policy.burstCapacity || policy.limit,
            policy.leakRatePerSec || (policy.limit / policy.windowSec)
          );
          this.leakyBuckets.set(stateKey, lb);
        }
        const res = lb.consume(cost);
        allowed = res.allowed;
        remaining = res.remaining;
        resetTimeMs = res.resetTimeMs;
        break;
      }

      case 'PENALTY_BOX': {
        // Direct counter for brute-force sensitive endpoints (e.g. OTP validation)
        let sw = this.slidingWindows.get(stateKey);
        if (!sw) {
          sw = new SlidingWindowCounter(policy.limit, policy.windowSec);
          this.slidingWindows.set(stateKey, sw);
        }
        const res = sw.consume(cost);
        allowed = res.allowed;
        remaining = res.remaining;
        resetTimeMs = res.resetTimeMs;
        break;
      }
    }

    // 3. Handle Violation Escalation to Penalty Box
    if (!allowed) {
      this.totalThrottled++;
      const currentViolations = (penalty?.violationsCount || 0) + 1;
      const maxAllowedViolations = policy.maxViolationsBeforePenalty || 3;

      if (currentViolations >= maxAllowedViolations) {
        const quarantineDuration = (policy.penaltyDurationSec || 60) * 1000;
        const quarantinedUntil = now + quarantineDuration;

        this.penaltyBox.set(stateKey, {
          clientId,
          policyKey,
          violationsCount: currentViolations,
          quarantinedUntil,
          reason: `Repeated threshold violation (${currentViolations} consecutive events on ${policy.name})`,
        });

        resetTimeMs = quarantinedUntil;
      } else {
        this.penaltyBox.set(stateKey, {
          clientId,
          policyKey,
          violationsCount: currentViolations,
          quarantinedUntil: 0,
          reason: 'Excess rate detected',
        });
      }

      const retryAfterSec = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
      this.logTelemetry(clientId, policyKey, false, remaining, policy.algorithm);

      return {
        allowed: false,
        policyKey,
        clientId,
        limit: policy.limit,
        remaining: 0,
        resetTimeMs,
        retryAfterSec,
        algorithm: policy.algorithm,
        penaltyBoxActive: (currentViolations >= maxAllowedViolations),
        headers: {
          'X-RateLimit-Limit': policy.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(resetTimeMs / 1000).toString(),
          'Retry-After': retryAfterSec.toString(),
        },
        reason: `429 Too Many Requests: Exceeded rate limit of ${policy.limit} req / ${policy.windowSec}s for ${policy.name}`,
        timestamp: now,
      };
    }

    // Request Allowed
    this.totalAllowed++;
    this.logTelemetry(clientId, policyKey, true, remaining, policy.algorithm);

    return {
      allowed: true,
      policyKey,
      clientId,
      limit: policy.limit,
      remaining,
      resetTimeMs,
      algorithm: policy.algorithm,
      penaltyBoxActive: false,
      headers: {
        'X-RateLimit-Limit': policy.limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.floor(resetTimeMs / 1000).toString(),
      },
      timestamp: now,
    };
  }

  private logTelemetry(
    clientId: string,
    policyKey: RateLimitPolicyKey,
    allowed: boolean,
    remaining: number,
    algorithm: RateLimitAlgorithm
  ) {
    this.telemetryHistory.unshift({
      id: `rl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      clientId,
      policyKey,
      allowed,
      remaining,
      algorithm,
    });

    if (this.telemetryHistory.length > 100) {
      this.telemetryHistory.pop();
    }
  }

  /**
   * Interactive Simulator for load testing burst limits in the dashboard
   */
  simulateBurst(policyKey: RateLimitPolicyKey, clientId: string, count = 10): RateLimitDecision[] {
    const decisions: RateLimitDecision[] = [];
    for (let i = 0; i < count; i++) {
      decisions.push(this.checkRateLimit(policyKey, clientId, 1));
    }
    return decisions;
  }

  // Management APIs
  getAllPolicies(): RateLimitPolicy[] {
    return Array.from(this.policies.values());
  }

  updatePolicy(policyKey: RateLimitPolicyKey, updates: Partial<RateLimitPolicy>): void {
    const existing = this.policies.get(policyKey);
    if (existing) {
      this.policies.set(policyKey, { ...existing, ...updates });
      // Invalidate existing buckets for this policy to apply new configuration
      this.resetPolicyBuckets(policyKey);
    }
  }

  getActivePenalties(): ClientPenaltyRecord[] {
    const now = Date.now();
    return Array.from(this.penaltyBox.values()).filter((p) => p.quarantinedUntil > now);
  }

  releasePenalty(clientId: string, policyKey: RateLimitPolicyKey): boolean {
    const stateKey = `${policyKey}::${clientId}`;
    const existed = this.penaltyBox.has(stateKey);
    this.penaltyBox.delete(stateKey);
    return existed;
  }

  resetClient(clientId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.tokenBuckets.keys()) {
      if (key.endsWith(`::${clientId}`)) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => this.tokenBuckets.delete(k));

    for (const key of this.slidingWindows.keys()) {
      if (key.endsWith(`::${clientId}`)) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => this.slidingWindows.delete(k));

    for (const key of this.leakyBuckets.keys()) {
      if (key.endsWith(`::${clientId}`)) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => this.leakyBuckets.delete(k));

    for (const key of this.penaltyBox.keys()) {
      if (key.endsWith(`::${clientId}`)) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => this.penaltyBox.delete(k));
  }

  private resetPolicyBuckets(policyKey: RateLimitPolicyKey): void {
    const prefix = `${policyKey}::`;
    for (const key of this.tokenBuckets.keys()) {
      if (key.startsWith(prefix)) this.tokenBuckets.delete(key);
    }
    for (const key of this.slidingWindows.keys()) {
      if (key.startsWith(prefix)) this.slidingWindows.delete(key);
    }
    for (const key of this.leakyBuckets.keys()) {
      if (key.startsWith(prefix)) this.leakyBuckets.delete(key);
    }
  }

  getTelemetry(): RateLimiterTelemetry {
    const now = Date.now();
    const activePenalties = Array.from(this.penaltyBox.values()).filter((p) => p.quarantinedUntil > now).length;
    return {
      totalInspected: this.totalInspected,
      totalAllowed: this.totalAllowed,
      totalThrottled: this.totalThrottled,
      activePenaltiesCount: activePenalties,
      history: [...this.telemetryHistory],
    };
  }
}

// Global Singleton Instance
export const rateLimiter = RateLimiterService.getInstance();
