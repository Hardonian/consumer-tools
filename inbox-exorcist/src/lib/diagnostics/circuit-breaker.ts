type CircuitState = "closed" | "open" | "half-open";

type CircuitConfig = {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxAttempts: number;
};

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30_000,
  halfOpenMaxAttempts: 3,
};

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;
  private config: CircuitConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get currentState(): CircuitState {
    if (this.state === "open") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.config.recoveryTimeoutMs) {
        this.state = "half-open";
        this.halfOpenAttempts = 0;
      }
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.currentState;
    if (state === "open") {
      throw new Error(
        `CircuitBreaker "${this.name}" is open. Service degraded.`,
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === "half-open") {
      this.halfOpenAttempts += 1;
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state = "closed";
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure() {
    this.failures += 1;
    this.lastFailureTime = Date.now();
    if (this.state === "half-open") {
      this.state = "open";
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = "open";
    }
  }

  reset() {
    this.state = "closed";
    this.failures = 0;
    this.halfOpenAttempts = 0;
  }

  get isOpen(): boolean {
    return this.currentState === "open";
  }

  get isDegraded(): boolean {
    return this.state !== "closed";
  }
}

const globalBreakers = globalThis as typeof globalThis & {
  __inboxExorcistBreakers?: Map<string, CircuitBreaker>;
};

function getBreakerRegistry(): Map<string, CircuitBreaker> {
  if (!globalBreakers.__inboxExorcistBreakers) {
    globalBreakers.__inboxExorcistBreakers = new Map();
  }
  return globalBreakers.__inboxExorcistBreakers;
}

export function getCircuitBreaker(name: string, config?: Partial<CircuitConfig>): CircuitBreaker {
  const registry = getBreakerRegistry();
  if (!registry.has(name)) {
    registry.set(name, new CircuitBreaker(name, config));
  }
  return registry.get(name)!;
}

export function resetCircuitBreakers() {
  getBreakerRegistry().forEach((breaker) => breaker.reset());
}
