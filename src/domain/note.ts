import { fitRect, rectFromPoints } from './geometry';
import type { Point, Rect, Size } from './geometry';

declare const noteIdBrand: unique symbol;

/** A string known to identify a note. You can't pass any random string where a NoteId is expected. */
export type NoteId = string & { readonly [noteIdBrand]: true };

export interface Note {
    readonly id: NoteId;
    readonly rect: Rect;
}

/** Everything that can change after a note exists. */
export type NoteChanges = Partial<Omit<Note, 'id'>>;

/** What the caller must decide when creating a note. The rest gets defaults. */
export type NewNote = Omit<Note, 'id'>;

export const MIN_NOTE_SIZE: Size = { width: 140, height: 100 };

/** Drags shorter than this (in px) on both axes are clicks, not "create a note". */
const CREATE_DRAG_THRESHOLD = 8;

/** The only place where a plain string becomes a NoteId. */
export function toNoteId(value: string): NoteId {
    return value as NoteId;
}

export function createNote(fields: NewNote): Note {
    return { id: toNoteId(crypto.randomUUID()), ...fields };
}

/** The one rule for updating a note, shared by the reducer and the storage. */
export function applyChanges(note: Note, changes: NoteChanges): Note {
    return { ...note, ...changes };
}

/** The rect a note would get if the user released the pointer now, or null if the drag is too small. */
export function noteRectFromDrag(origin: Point, current: Point, bounds: Size): Rect | null {
    const rect = rectFromPoints(origin, current);
    if (rect.width < CREATE_DRAG_THRESHOLD && rect.height < CREATE_DRAG_THRESHOLD) {
        return null;
    }
    return fitRect(rect, MIN_NOTE_SIZE, bounds);
}