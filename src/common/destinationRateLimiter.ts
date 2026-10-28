/*
 * Copyright (c) 2024. Devtron Inc.
 */

// Paces sends to the same destination key ~1/sec, mirroring Google Chat's (and Slack's)
// 1 write/sec/space limit. A bulk action (e.g. editing 20 apps) can produce that many
// audit events within the same second, which would otherwise burst that many sends at
// the same destination at once and get 429'd.
//
// This lives in notifier - the service that actually talks to each destination - rather
// than in the orchestrator that decides who to notify, so one pacing mechanism covers
// every channel type instead of being reimplemented per caller.
//
// Sends are queued per destination and drained in the background - callers must NOT
// await the pacing delay itself. Notifier processes one NATS message (or REST request)
// at a time (max_ack_pending: 1) and doesn't ack/respond until its handler returns; if
// the handler blocked here, a burst of audit alerts to one Slack channel would stall
// every other notification (including unrelated CI/CD alerts) behind it for the whole
// burst duration. sendPaced returns immediately - the caller's handler finishes and the
// next message is picked up right away, while this queue drains at ~1/sec in the
// background.
//
// Known limitation: this state is in-memory and per-process. If notifier runs multiple
// replicas, each paces independently and the same destination can still be hit faster
// than 1/sec in aggregate - the same blind spot the orchestrator-side implementation
// this replaces already had, just relocated. A real fix needs a shared store (Redis, a
// timestamp column) - out of scope here.
//
// Also: a send still queued when the process restarts is lost - no worse than the
// previous in-process-sleep design, since neither survives a restart.

const MIN_INTERVAL_MS = 1000;
const queues = new Map<string, Promise<void>>();

export function sendPaced(key: string, send: () => Promise<void>): void {
    const prev = queues.get(key) ?? Promise.resolve();
    const next = prev
        .then(send)
        .catch(() => {}) // send() is responsible for logging/recording its own failure
        .then(() => new Promise<void>((resolve) => setTimeout(resolve, MIN_INTERVAL_MS)));
    queues.set(key, next);
    next.then(() => {
        // Only clear the queue entry if nothing else was enqueued behind us in the
        // meantime - otherwise we'd drop a newer queue's tracking.
        if (queues.get(key) === next) queues.delete(key);
    });
}
