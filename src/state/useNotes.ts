import { useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { Rect } from '../domain/geometry';
import { createNote, isOnTop, nextZ } from '../domain/note';
import type { Note, NoteId } from '../domain/note';
import { initialNotesState, notesReducer } from './notesReducer';

/** Everything the UI can ask for. Components never see `dispatch` */

export interface NotesCommands {
    readonly createNote: (rect: Rect) => void;
    readonly setNoteRect: (id: NoteId, rect: Rect) => void;
    readonly deleteNote: (id: NoteId) => void;
    readonly setNoteText: (id: NoteId, text: string) => void;
    readonly bringToFront: (id: NoteId) => void;
}

export interface UseNotesResult {
    readonly notes: readonly Note[];
    readonly commands: NotesCommands;
}

export function useNotes(): UseNotesResult {
    const [state, dispatch] = useReducer(notesReducer, initialNotesState);
    // Latest notes for commands, without re-creating the commands on every change.
    const notesRef = useRef(state.notes);
    useLayoutEffect(() => {
        notesRef.current = state.notes;
    }, [state.notes]);

    // `dispatch` never changes, so one commands object can live as long as the component.
    // React keeps a lazy initial state for the component's lifetime; useMemo is only a
    // cache React may drop. (StrictMode calls the initializer twice in dev; that's fine
    // because it has no side effects);

    const [commands] = useState<NotesCommands>(
        () => ({
            createNote(rect) {
                dispatch({ type: 'note/added', note: createNote({ rect, z: nextZ(notesRef.current) }) });
            },
            setNoteRect(id, rect) {
                dispatch({ type: 'note/updated', id, changes: { rect } });
            },
            deleteNote(id) {
                dispatch({ type: 'note/removed', id });
            },
            setNoteText(id, text) {
                dispatch({ type: 'note/updated', id, changes: { text } })
            },
            bringToFront(id) {
                const notes = notesRef.current;
                const note = notes.find((candidate) => candidate.id === id);
                if (note === undefined || isOnTop(note, notes)) return;
                dispatch({ type: 'note/updated', id, changes: { z: nextZ(notes) } });
            },
        }),
    );

    return { notes: state.notes, commands };
}