import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { Rect } from '../domain/geometry';
import { createNote, isOnTop, nextZ } from '../domain/note';
import type { Note, NoteChanges, NoteId } from '../domain/note';
import type { NotesRepository } from '../persistence/NotesRepository';
import { initialNotesState, notesReducer } from './notesReducer';
import type { LoadStatus } from './notesReducer';

/** Everything the UI can ask for. Components never see `dispatch`. */
export interface NotesCommands {
    readonly createNote: (rect: Rect) => void;
    readonly setNoteRect: (id: NoteId, rect: Rect) => void;
    readonly deleteNote: (id: NoteId) => void;
    readonly setNoteText: (id: NoteId, text: string) => void;
    readonly bringToFront: (id: NoteId) => void;
}

export interface UseNotesResult {
    readonly status: LoadStatus;
    readonly notes: readonly Note[];
    readonly commands: NotesCommands;
}

export function useNotes(repository: NotesRepository): UseNotesResult {
    const [state, dispatch] = useReducer(notesReducer, initialNotesState);

    // Latest notes for commands, without re-creating the commands on every change.
    const notesRef = useRef(state.notes);
    useLayoutEffect(() => {
        notesRef.current = state.notes;
    }, [state.notes]);

    useEffect(() => {
        let cancelled = false; // StrictMode runs effects twice in dev; ignore the stale result.
        repository.list().then(
            (notes) => {
                if (!cancelled) dispatch({ type: 'notes/loaded', notes });
            },
            (cause: unknown) => {
                console.error('Could not load notes', cause);
                if (!cancelled) dispatch({ type: 'notes/loadFailed' });
            },
        );
        return () => {
            cancelled = true;
        };
    }, [repository]);

    // One commands object for the component's lifetime (a lazy initial state, not a
    // droppable useMemo cache). `repository` must be stable (created outside React).
    const [commands] = useState<NotesCommands>(() => {
        /** Fire-and-forget save. Bonus V replaces this with a proper queue. */
        function save(operation: Promise<void>): void {
            operation.catch((cause: unknown) => console.error('Could not save', cause));
        }

        /** Optimistic update: change the UI now, persist in the background. */
        function update(id: NoteId, changes: NoteChanges): void {
            dispatch({ type: 'note/updated', id, changes });
            save(repository.update(id, changes));
        }

        return {
            createNote(rect) {
                const note = createNote({ rect, z: nextZ(notesRef.current) });
                dispatch({ type: 'note/added', note });
                save(repository.create(note));
            },
            setNoteRect(id, rect) {
                update(id, { rect });
            },
            setNoteText(id, text) {
                update(id, { text });
            },
            bringToFront(id) {
                const notes = notesRef.current;
                const note = notes.find((candidate) => candidate.id === id);
                if (note === undefined || isOnTop(note, notes)) return;
                update(id, { z: nextZ(notes) });
            },
            deleteNote(id) {
                dispatch({ type: 'note/removed', id });
                save(repository.remove(id));
            },
        };
    });

    return { status: state.status, notes: state.notes, commands };
}