import { applyChanges } from '../domain/note';
import type { Note, NoteChanges, NoteId } from '../domain/note';
import { assertNever } from '../utils/assertNever';

export type LoadStatus = 'loading' | 'ready' | 'failed';

export interface NotesState {
    readonly status: LoadStatus;
    readonly notes: readonly Note[];
}

export type NotesAction =
    | { readonly type: 'notes/loaded'; readonly notes: readonly Note[] }
    | { readonly type: 'notes/loadFailed' }
    | { readonly type: 'note/added'; readonly note: Note }
    | { readonly type: 'note/updated'; readonly id: NoteId; readonly changes: NoteChanges }
    | { readonly type: 'note/removed'; readonly id: NoteId };

export const initialNotesState: NotesState = { status: 'loading', notes: [] };

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
    switch (action.type) {
        case 'notes/loaded':
            return { status: 'ready', notes: action.notes };
        case 'notes/loadFailed':
            return { ...state, status: 'failed' };
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