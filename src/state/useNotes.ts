import { useReducer, useState } from 'react';
import type { Rect } from '../domain/geometry';
import { createNote } from '../domain/note';
import type { Note, NoteId } from '../domain/note';
import { initialNotesState, notesReducer } from './notesReducer';

/** Everything the UI can ask for. Components never see `dispatch` */

export interface NotesCommands {
    readonly createNote: (rect: Rect) => void;
    readonly setNoteRect: (id: NoteId, rect: Rect) => void;
    readonly deleteNote: (id: NoteId) => void;
    readonly setNoteText: (id: NoteId, text: string) => void;
}

export interface UseNotesResult {
    readonly notes: readonly Note[];
    readonly commands: NotesCommands;
}

export function useNotes(): UseNotesResult {
    const [state, dispatch] = useReducer(notesReducer, initialNotesState);

    // `dispatch` never changes, so one commands object can live as long as the component.
    // React keeps a lazy initial state for the component's lifetime; useMemo is only a
    // cache React may drop. (StrictMode calls the initializer twice in dev; that's fine
    // because it has no side effects);

    const [commands] = useState<NotesCommands>(
        () => ({
            createNote(rect) {
                dispatch({ type: 'note/added', note: createNote({ rect }) });
            },
            setNoteRect(id, rect) {
                dispatch({ type: 'note/updated', id, changes: { rect } });
            },
            deleteNote(id) {
                dispatch({ type: 'note/removed', id });
            },
            setNoteText(id, text) {
                dispatch({ type: 'note/updated', id, changes: { text } })
            }
        }),
    );

    return { notes: state.notes, commands };
}