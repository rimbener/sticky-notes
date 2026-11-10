import { applyChanges } from '../domain/note';
import type { Note, NoteChanges, NoteId } from '../domain/note';
import { assertNever } from '../utils/assertNever';

export interface NotesState {
    readonly notes: readonly Note[];
}

export type NotesAction =
    | { readonly type: 'note/added'; readonly note: Note }
    | { readonly type: 'note/updated'; readonly id: NoteId; readonly changes: NoteChanges }
    | { readonly type: 'note/removed'; readonly id: NoteId };

export const initialNotesState: NotesState = { notes: [] };

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
    switch (action.type) {
        case 'note/added':
            return { ...state, notes: [...state.notes, action.note] };
        case 'note/updated':
            return {
                ...state,
                notes: state.notes.map((note) =>
                    note.id === action.id ? applyChanges(note, action.changes) : note,
                ),
            };
        case 'note/removed':
            return { ...state, notes: state.notes.filter((note) => note.id !== action.id) };
        default:
            return assertNever(action);
    }
}