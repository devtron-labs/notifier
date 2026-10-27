/*
 * Copyright (c) 2024. Devtron Inc.
 */

// Audit notification templates interpolate free-text values (resource names, emails)
// into JSON documents using Mustache's unescaped {{&field}} syntax - deliberately, so
// Mustache's default HTML-escaping doesn't turn a literal " into &quot; (which would
// also be wrong for a JSON body). But unescaped alone isn't enough: if the value itself
// contains a literal " (e.g. a cluster or environment named `Prod "Primary"` - nothing
// in Devtron's validation blocks that), it terminates the surrounding JSON string early
// and the whole payload becomes invalid JSON.
//
// jsonSafeAuditData pre-escapes every string value the way JSON itself requires
// (", \, newlines, etc.) - NOT HTML-escaping - so {{&field}} always renders into valid
// JSON regardless of what the underlying value contains.
export function jsonSafeAuditData(data: Record<string, any> | undefined): Record<string, any> {
    if (!data) return data as any;
    const safe: Record<string, any> = {};
    for (const key of Object.keys(data)) {
        const value = data[key];
        // JSON.stringify a string gives back a fully-escaped JSON string literal
        // (including the surrounding quotes); stripping those quotes leaves exactly
        // the escaped inner content, which is what {{&field}} needs to insert between
        // the quotes the template itself already provides.
        safe[key] = typeof value === 'string' ? JSON.stringify(value).slice(1, -1) : value;
    }
    return safe;
}
