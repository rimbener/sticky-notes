import { describe, expect, it } from 'vitest';
import { toNoteId } from '../domain/note';
import type { Note } from '../domain/note';
import { initialNotesState, notesReducer } from './notesReducer';
import type { NotesState } from './notesReducer';

function makeNote(id: string, z = 1): Note {
    return {
        id: toNoteId(id),
        rect: { x: 0, y: 0, width: 150, height: 100 },
        text: '',
        z,
        color: 'yellow',
    };
}

const ready = (notes: Note[]): NotesState => ({ status: 'ready', notes });

describe('notesReducer', () => {
    it('starts loading and becomes ready on load', () => {
        const notes = [makeNote('a')];
        expect(notesReducer(initialNotesState, { type: 'notes/loaded', notes })).toEqual(ready(notes));
    });

    it('adds a note', () => {
        const note = makeNote('a');
        expect(notesReducer(ready([]), { type: 'note/added', note }).notes).toEqual([note]);
    });

    it('updates only the target note and keeps the others by reference', () => {
        const a = makeNote('a');
        const b = makeNote('b');
        const next = notesReducer(ready([a, b]), {
            type: 'note/updated',
            id: a.id,
            changes: { text: 'hello' },
        });
        expect(next.notes[0]).toEqual({ ...a, text: 'hello' });
        expect(next.notes[1]).toBe(b); // this is what lets React.memo skip b
    });

    it('removes a note', () => {
        const a = makeNote('a');
        const b = makeNote('b');
        expect(notesReducer(ready([a, b]), { type: 'note/removed', id: a.id }).notes).toEqual([b]);
    });
});