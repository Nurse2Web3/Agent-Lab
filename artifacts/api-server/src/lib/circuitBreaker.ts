import CircuitBreaker from "opossum";
import type { ProviderCallOptions, ProviderResult } from "./providers/types.js";

// Circuit breaker configuration
const CIRCUIT_BREAKER_OPTIONS: CircuitBreaker.CircuitBreakerOptions = {
  timeout: 30000, // If a provider call takes > 30s, consider it a failure
  errorThresholdPercentage: 50, // Open circuit after 50% failures
  resetTimeout: 60000, // Try again after 60s (half-open state)
  rollingCountBuckets: 10, // 10 buckets for rolling stats
  rollingCountTimeout: 30000, // 30 second rolling window
  volumeThreshold: 3, // Need at least 3 calls before tripping
};

// Cache for circuit breakers per provider
const breakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a specific provider
 */
function getBreaker(provider: string): CircuitBreaker {
  if (!breakers.has(provider)) {
    const breaker = new CircuitBreaker(
      async (fn: () => Promise<ProviderResult>, options: ProviderCallOptions) => {
        return await fn();
      },
      CIRCUIT_BREAKER_OPTIONS
    );

    // Log state changes for monitoring
    breaker.on("open", () => {
      console.warn(`[CircuitBreaker] ${provider} circuit OPEN - provider may be unavailable`);
    });
    breaker.on("halfOpen", () => {
      console.log(`[CircuitBreaker] ${provider} circuit HALF-OPEN - testing provider`);
    });
    breaker.on("close", () => {
      console.log(`[CircuitBreaker] ${provider} circuit CLOSED - provider healthy`);
    });
    breaker.on("failure", (error) => {
      console.warn(`[CircuitBreaker] ${provider} failure: ${error.message}`);
    });

    breakers.set(provider, breaker);
  }
  return breakers.get(provider)!;
}

/**
 * Execute a provider call through the circuit breaker
 */
export async function executeWithCircuitBreaker(
  provider: string,
  fn: () => Promise<ProviderResult>,
  options: ProviderCallOptions
): Promise<ProviderResult> {
  const breaker = getBreaker(provider);

  // Check if circuit is open before attempting
  if (breaker.open) {
    throw new Error(
      `Provider ${provider} is currently unavailable (circuit open). Try again in ${CIRCUIT_BREAKER_OPTIONS.resetTimeout / 1000} seconds.`
    );
  }

  try {
    return await breaker.fire(fn, options);
  } catch (error: any) {
    // If circuit just opened, provide helpful error
    if (breaker.open) {
      throw new Error(
        `Provider ${provider} failed too many times. Circuit breaker opened. Will retry in ${CIRCUIT_BREAKER_OPTIONS.resetTimeout / 1000} seconds.`
      );
    }
    throw error;
  }
}

/**
 * Get circuit breaker status for all providers
 */
export function getCircuitBreakerStatus() {
  const status: Record<string, {
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    failures: number;
    successes: number;
    errorRate: number;
  }> = {};

  for (const [provider, breaker] of breakers.entries()) {
    const stats = breaker.stats;
    const failures = stats.failures || 0;
    const successes = stats.successes || 0;
    const total = failures + successes;
    status[provider] = {
      state: breaker.open ? "OPEN" : breaker.halfOpen ? "HALF_OPEN" : "CLOSED",
      failures,
      successes,
      errorRate: total > 0 ? (failures / total) * 100 : 0,
    };
  }

  return status;
}

/**
 * Reset a specific circuit breaker (for manual intervention)
 */
export function resetCircuitBreaker(provider: string) {
  const breaker = breakers.get(provider);
  if (breaker) {
    breaker.close();
    console.log(`[CircuitBreaker] ${provider} circuit manually reset`);
  }
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers() {
  for (const [provider, breaker] of breakers.entries()) {
    breaker.close();
    console.log(`[CircuitBreaker] ${provider} circuit manually reset`);
  }
}
