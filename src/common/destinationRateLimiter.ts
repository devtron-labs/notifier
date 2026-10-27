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
// Known limitation: this state is in-memory and per-process. If notifier runs multiple
// replicas, each paces independently and the same destination can still be hit faster
// than 1/sec in aggregate - the same blind spot the orchestrator-side implementation
// this replaces already had, just relocated. A real fix needs a shared store (Redis, a
// timestamp column) - out of scope here.

const MIN_INTERVAL_MS = 1000;
const lastSentAt = new Map<string, number>();

export async function waitForDestinationTurn(key: string): Promise<void> {
    const now = Date.now();
    const last = lastSentAt.get(key);
    let wait = 0;
    if (last !== undefined) {
        const elapsed = now - last;
        if (elapsed < MIN_INTERVAL_MS) {
            wait = MIN_INTERVAL_MS - elapsed;
        }
    }
    // Reserve this slot now, before awaiting, so a concurrently-dispatched send to the
    // same key waits behind this one too.
    lastSentAt.set(key, now + wait);
    if (wait > 0) {
        await new Promise(resolve => setTimeout(resolve, wait));
    }
}
