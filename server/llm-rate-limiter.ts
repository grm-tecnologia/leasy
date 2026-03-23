/**
 * Rate limiter for OpenAI API calls.
 *
 * Implements a token-bucket algorithm per user to prevent abuse:
 * - Each user gets a bucket with a configurable max tokens and refill rate.
 * - Global limiter also prevents total API cost from exceeding a threshold.
 *
 * Configuration via environment variables:
 *   LLM_RATE_LIMIT_PER_USER_PER_MIN  (default: 5)
 *   LLM_RATE_LIMIT_GLOBAL_PER_MIN    (default: 60)
 *   LLM_DAILY_BUDGET_USD             (default: 50)
 */

// ─── Configuration ──────────────────────────────────────────────────

const PER_USER_PER_MIN = parseInt(process.env.LLM_RATE_LIMIT_PER_USER_PER_MIN ?? "5", 10);
const GLOBAL_PER_MIN = parseInt(process.env.LLM_RATE_LIMIT_GLOBAL_PER_MIN ?? "60", 10);
const DAILY_BUDGET_USD = parseFloat(process.env.LLM_DAILY_BUDGET_USD ?? "50");

// Approximate cost per 1K tokens for gpt-4o-mini (input + output average)
const COST_PER_1K_TOKENS_USD = 0.00015 + 0.0006; // input: $0.15/1M + output: $0.60/1M

// ─── Token Bucket ───────────────────────────────────────────────────

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const userBuckets = new Map<string, Bucket>();
const globalBucket: Bucket = { tokens: GLOBAL_PER_MIN, lastRefill: Date.now() };

function refillBucket(bucket: Bucket, maxTokens: number): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const refillRate = maxTokens / 60000; // tokens per millisecond
  const tokensToAdd = elapsed * refillRate;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

function tryConsume(bucket: Bucket, maxTokens: number): boolean {
  refillBucket(bucket, maxTokens);
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

// ─── Daily Cost Tracker ─────────────────────────────────────────────

let dailyCostUsd = 0;
let dailyCostDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function resetDailyCostIfNeeded(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyCostDate) {
    dailyCostUsd = 0;
    dailyCostDate = today;
  }
}

export function recordTokenUsage(totalTokens: number): void {
  resetDailyCostIfNeeded();
  const cost = (totalTokens / 1000) * COST_PER_1K_TOKENS_USD;
  dailyCostUsd += cost;
}

export function getDailyCostUsd(): number {
  resetDailyCostIfNeeded();
  return dailyCostUsd;
}

// ─── Public API ─────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

/**
 * Check if an LLM call is allowed for the given user.
 * Returns { allowed: true } or { allowed: false, reason, retryAfterMs }.
 */
export function checkLLMRateLimit(userId: string | number): RateLimitResult {
  // 1. Check daily budget
  resetDailyCostIfNeeded();
  if (dailyCostUsd >= DAILY_BUDGET_USD) {
    return {
      allowed: false,
      reason: `Orçamento diário de IA atingido (US$ ${DAILY_BUDGET_USD.toFixed(2)}). Tente novamente amanhã.`,
      retryAfterMs: getMillisUntilMidnight(),
    };
  }

  // 2. Check global rate limit
  if (!tryConsume(globalBucket, GLOBAL_PER_MIN)) {
    return {
      allowed: false,
      reason: "Limite global de requisições de IA atingido. Aguarde um momento.",
      retryAfterMs: 10000,
    };
  }

  // 3. Check per-user rate limit
  const userKey = String(userId);
  if (!userBuckets.has(userKey)) {
    userBuckets.set(userKey, { tokens: PER_USER_PER_MIN, lastRefill: Date.now() });
  }
  const userBucket = userBuckets.get(userKey)!;
  if (!tryConsume(userBucket, PER_USER_PER_MIN)) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${PER_USER_PER_MIN} requisições de IA por minuto. Aguarde um momento.`,
      retryAfterMs: 15000,
    };
  }

  return { allowed: true };
}

/**
 * Get metrics for monitoring.
 */
export function getLLMRateLimitMetrics() {
  resetDailyCostIfNeeded();
  return {
    dailyCostUsd: Math.round(dailyCostUsd * 10000) / 10000,
    dailyBudgetUsd: DAILY_BUDGET_USD,
    budgetUsedPercent: Math.round((dailyCostUsd / DAILY_BUDGET_USD) * 100),
    globalTokensRemaining: Math.floor(globalBucket.tokens),
    activeUsers: userBuckets.size,
    limits: {
      perUserPerMin: PER_USER_PER_MIN,
      globalPerMin: GLOBAL_PER_MIN,
    },
  };
}

// ─── Cleanup ────────────────────────────────────────────────────────

// Periodically clean up stale user buckets (every 5 minutes)
setInterval(() => {
  const staleThreshold = Date.now() - 5 * 60 * 1000;
  for (const [key, bucket] of userBuckets) {
    if (bucket.lastRefill < staleThreshold) {
      userBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ─── Helpers ────────────────────────────────────────────────────────

function getMillisUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}
