import { EventEmitter } from "node:events";
import {
  appendMonitorSnapshot,
  countMatches,
  getMonitorJob,
  setMonitorAlerted,
  setMonitorError,
  type MonitorJob,
  type MonitoringSnapshot
} from "@/lib/database";
import { TOTAL_RESOLVERS } from "@/lib/nameservers";
import { queryGlobalResolvers } from "@/lib/dns-resolver";
import { sendPropagationNotifications } from "@/lib/notifications";

const MONITOR_INTERVAL_MS = 60_000;

type MonitorUpdateEvent = {
  type: "snapshot" | "error" | "completed";
  monitorId: string;
  monitor: MonitorJob | null;
  snapshot?: MonitoringSnapshot;
  error?: string;
};

type MonitoringRuntime = {
  emitter: EventEmitter;
  intervals: Map<string, NodeJS.Timeout>;
  inFlight: Set<string>;
};

const runtimeKey = "__dnsPropagationRuntime" as const;

function runtime(): MonitoringRuntime {
  const globalState = globalThis as typeof globalThis & {
    [runtimeKey]?: MonitoringRuntime;
  };

  if (!globalState[runtimeKey]) {
    globalState[runtimeKey] = {
      emitter: new EventEmitter(),
      intervals: new Map<string, NodeJS.Timeout>(),
      inFlight: new Set<string>()
    };
  }

  return globalState[runtimeKey];
}

function emit(update: MonitorUpdateEvent): void {
  runtime().emitter.emit(update.monitorId, update);
}

export function subscribeToMonitor(
  monitorId: string,
  handler: (event: MonitorUpdateEvent) => void
): () => void {
  const emitter = runtime().emitter;
  emitter.on(monitorId, handler);
  return () => emitter.off(monitorId, handler);
}

async function executeMonitorCheck(monitorId: string): Promise<void> {
  const state = runtime();
  if (state.inFlight.has(monitorId)) {
    return;
  }

  state.inFlight.add(monitorId);

  try {
    const monitor = await getMonitorJob(monitorId);
    if (!monitor) {
      stopMonitorLoop(monitorId);
      return;
    }

    const resolverResults = await queryGlobalResolvers({
      domain: monitor.domain,
      recordType: monitor.recordType,
      expectedValue: monitor.expectedValue
    });

    const { resolvedCount, propagationPercent } = countMatches(resolverResults);

    const snapshot: MonitoringSnapshot = {
      checkedAt: new Date().toISOString(),
      resolvedCount,
      totalResolvers: resolverResults.length || TOTAL_RESOLVERS,
      propagationPercent,
      resolverResults
    };

    const updatedMonitor = await appendMonitorSnapshot(monitorId, snapshot);
    emit({
      type: "snapshot",
      monitorId,
      monitor: updatedMonitor,
      snapshot
    });

    if (
      updatedMonitor &&
      !updatedMonitor.alertedAt &&
      propagationPercent >= updatedMonitor.alertThreshold
    ) {
      await sendPropagationNotifications({ monitor: updatedMonitor, snapshot });
      await setMonitorAlerted(monitorId);
      const completedMonitor = await getMonitorJob(monitorId);
      emit({
        type: "completed",
        monitorId,
        monitor: completedMonitor,
        snapshot
      });
      stopMonitorLoop(monitorId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected monitoring error";
    await setMonitorError(monitorId, message);
    emit({
      type: "error",
      monitorId,
      monitor: await getMonitorJob(monitorId),
      error: message
    });
  } finally {
    state.inFlight.delete(monitorId);
  }
}

export async function triggerMonitorCheck(monitorId: string): Promise<void> {
  await executeMonitorCheck(monitorId);
}

export function startMonitorLoop(monitorId: string): void {
  const state = runtime();

  if (state.intervals.has(monitorId)) {
    return;
  }

  const interval = setInterval(() => {
    void executeMonitorCheck(monitorId);
  }, MONITOR_INTERVAL_MS);

  state.intervals.set(monitorId, interval);

  void executeMonitorCheck(monitorId);
}

export function stopMonitorLoop(monitorId: string): void {
  const state = runtime();
  const interval = state.intervals.get(monitorId);
  if (interval) {
    clearInterval(interval);
    state.intervals.delete(monitorId);
  }
}

export async function getMonitorState(monitorId: string): Promise<MonitorJob | null> {
  return getMonitorJob(monitorId);
}

export type { MonitorUpdateEvent };
