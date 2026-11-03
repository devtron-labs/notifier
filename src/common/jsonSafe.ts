/*
 * Copyright (c) 2024. Devtron Inc.
 */

import Mustache from 'mustache';

// Audit notification templates interpolate free-text values (resource names, emails)
// into JSON documents, and some of those documents (emails, Slack messages) also
// interpret part of their content as HTML/markup. Each destination needs its own
// combination of escaping, applied in this order: destination-specific markup escaping
// first, then JSON escaping last (JSON escaping must be the final step so it isn't
// itself undone/corrupted by a later escaping pass).

function mapStrings(data: Record<string, any> | undefined, fn: (s: string) => string): Record<string, any> {
    if (!data) return data as any;
    const out: Record<string, any> = {};
    for (const key of Object.keys(data)) {
        const value = data[key];
        out[key] = typeof value === 'string' ? fn(value) : value;
    }
    return out;
}

// jsonSafeAuditData JSON-escapes every string value (", \, newlines, etc. - NOT HTML
// entities) so {{&field}}/noHtmlEscape-rendered values always produce valid JSON,
// regardless of what the underlying value contains. Must be applied last, after any
// destination-specific markup escaping below.
export function jsonSafeAuditData(data: Record<string, any> | undefined): Record<string, any> {
    return mapStrings(data, (value) => JSON.stringify(value).slice(1, -1));
}

// htmlSafeAuditData HTML-escapes every string value, for destinations that render part
// of the payload as real HTML (SES/SMTP email bodies). Without this, a resource name
// like `<a href="evil.example">Reset your password</a>` becomes a real, clickable link
// in the delivered email.
const escapeHtml = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function htmlSafeAuditData(data: Record<string, any> | undefined): Record<string, any> {
    return mapStrings(data, escapeHtml);
}

// slackSafeAuditData escapes only &, < and > - Slack's own markup control characters.
// Slack renders `<url|label>` as a clickable link with an arbitrary label, so a
// resource name containing that syntax would otherwise render as a real link.
const escapeSlackMarkup = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function slackSafeAuditData(data: Record<string, any> | undefined): Record<string, any> {
    return mapStrings(data, escapeSlackMarkup);
}

// noHtmlEscape disables Mustache's own HTML-escaping, so {{field}} and {{&field}}
// behave identically for audit renders. Without this, an admin who writes a webhook
// template with the ordinary {{field}} form (the form every other variable in this
// system uses) would get their value HTML-escaped by Mustache on top of our own
// escaping above, corrupting it (e.g. jsonSafeAuditData's `\"` becomes `\&quot;`,
// which is not a valid JSON escape sequence).
const noHtmlEscape = { escape: (v: any) => String(v) };

// renderAuditTemplate renders with Mustache's HTML-escaping disabled. @types/mustache
// only types the legacy 4th-arg form (a custom-delimiter tags array) and hasn't caught
// up with Mustache 4.x's config.escape API - confirmed directly against the installed
// mustache.js (Writer.prototype.getConfigEscape) that this config form is real and
// supported at runtime; the `as any` below is working around a types-only gap, not a
// runtime one.
export function renderAuditTemplate(template: string, data: Record<string, any>): string {
    return (Mustache.render as any)(template, data, {}, noHtmlEscape);
}
