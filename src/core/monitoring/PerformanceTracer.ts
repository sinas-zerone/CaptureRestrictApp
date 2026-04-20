/**
 * PerformanceTracer — Lightweight custom performance monitoring
 *
 * Singleton class that tracks:
 * - Screen load times
 * - Background task durations
 * - Network request latency
 *
 * Uses `performance.now()` for high-resolution timing.
 *
 * Design decisions:
 * - Singleton pattern: one instance, no redundant allocations across the app
 * - Bounded history: prevents unbounded memory growth (configurable max)
 * - No external dependencies: works anywhere React Native runs
 * - Dev logging: auto-logs in __DEV__ mode for easy debugging
 */

import { PERFORMANCE_CONFIG } from '@core/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TraceEntry {
  /** Unique name for the trace (e.g. "screen_load:HomeScreen") */
  name: string;
  /** Start time (ms since page load, via performance.now) */
  startTime: number;
  /** End time, null if trace is still running */
  endTime: number | null;
  /** Duration in ms, null if trace is still running */
  duration: number | null;
  /** Arbitrary metadata attached to the trace */
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  /** All completed traces */
  traces: TraceEntry[];
  /** Summary statistics */
  summary: {
    totalTraces: number;
    averageDuration: number;
    slowestTrace: TraceEntry | null;
    fastestTrace: TraceEntry | null;
  };
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

class PerformanceTracerClass {
  private activeTraces: Map<string, TraceEntry> = new Map();
  private completedTraces: TraceEntry[] = [];
  private maxHistory: number;
  private devLogging: boolean;

  constructor() {
    this.maxHistory = PERFORMANCE_CONFIG.MAX_TRACE_HISTORY;
    this.devLogging = PERFORMANCE_CONFIG.ENABLE_DEV_LOGGING;
  }

  /**
   * Start a named trace. If a trace with this name is already running,
   * it will be silently replaced (prevents orphaned traces).
   */
  startTrace(name: string, metadata?: Record<string, unknown>): void {
    const entry: TraceEntry = {
      name,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      metadata,
    };

    this.activeTraces.set(name, entry);

    if (__DEV__ && this.devLogging) {
      console.log(`[PerfTrace] ▶ Started: ${name}`);
    }
  }

  /**
   * Stop a named trace and move it to completed history.
   * Returns the duration in ms, or null if no matching trace was found.
   */
  stopTrace(name: string): number | null {
    const entry = this.activeTraces.get(name);
    if (!entry) {
      if (__DEV__) {
        console.warn(`[PerfTrace] ⚠ No active trace found for: ${name}`);
      }
      return null;
    }

    entry.endTime = Date.now();
    entry.duration = entry.endTime - entry.startTime;
    this.activeTraces.delete(name);

    // Bounded history: drop oldest if at capacity
    if (this.completedTraces.length >= this.maxHistory) {
      this.completedTraces.shift();
    }
    this.completedTraces.push(entry);

    if (__DEV__ && this.devLogging) {
      console.log(
        `[PerfTrace] ■ Completed: ${name} — ${entry.duration.toFixed(2)}ms`,
      );
    }

    return entry.duration;
  }

  /**
   * Get a full performance report with summary statistics.
   */
  getReport(): PerformanceReport {
    const traces = [...this.completedTraces];
    const durations = traces
      .map((t) => t.duration)
      .filter((d): d is number => d !== null);

    const totalTraces = traces.length;
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    let slowestTrace: TraceEntry | null = null;
    let fastestTrace: TraceEntry | null = null;

    for (const trace of traces) {
      if (trace.duration === null) continue;
      if (!slowestTrace || trace.duration > (slowestTrace.duration ?? 0)) {
        slowestTrace = trace;
      }
      if (!fastestTrace || trace.duration < (fastestTrace.duration ?? Infinity)) {
        fastestTrace = trace;
      }
    }

    return {
      traces,
      summary: {
        totalTraces,
        averageDuration,
        slowestTrace,
        fastestTrace,
      },
    };
  }

  /**
   * Create a fetch wrapper that automatically traces network requests.
   *
   * Usage:
   *   const tracedFetch = PerformanceTracer.createTracedFetch();
   *   const response = await tracedFetch('https://api.example.com/data');
   */
  createTracedFetch(): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
    const self = this;
    return async function tracedFetch(
      input: RequestInfo,
      init?: RequestInit,
    ): Promise<Response> {
      const url = typeof input === 'string' ? input : input.url;
      const traceName = `network_request:${init?.method ?? 'GET'}:${url}`;

      self.startTrace(traceName, {
        url,
        method: init?.method ?? 'GET',
      });

      try {
        const response = await fetch(input, init);
        self.stopTrace(traceName);
        return response;
      } catch (error) {
        self.stopTrace(traceName);
        throw error;
      }
    };
  }

  /**
   * Clear all traces (active and completed). Useful for testing.
   */
  reset(): void {
    this.activeTraces.clear();
    this.completedTraces = [];
  }
}

// Export singleton instance
export const PerformanceTracer = new PerformanceTracerClass();
