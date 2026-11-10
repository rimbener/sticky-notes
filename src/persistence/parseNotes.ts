import type { Rect } from '../domain/geometry';
import { toNoteId } from '../domain/note';
import type { Note } from '../domain/note';

// Data from localStorage or the network is `unknown` until we check it.
// These functions are the trust boundary: no `as Note` casts on raw JSON.

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function parseRect(value: unknown): Rect | null {
    if (!isRecord(value)) return null;
    const { x, y, width, height } = value;
    if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height)) {
        return null;
    }
    return { x, y, width, height };
}

export function parseNote(value: unknown): Note | null {
    if (!isRecord(value)) return null;
    const { id, text, z } = value;
    const rect = parseRect(value.rect);
    if (typeof id !== 'string' || rect === null || typeof text !== 'string' || !isFiniteNumber(z)) {
        return null;
    }
    return { id: toNoteId(id), rect, text, z };
}

export function parseNotes(value: unknown): Note[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        const note = parseNote(item);
        return note ? [note] : [];
    });
}