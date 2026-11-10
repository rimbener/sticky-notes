import type { Note, NoteChanges, NoteId } from '../domain/note';

/**
 * Where notes live. The UI only knows this interface, so localStorage,
 * a mocked REST API or a real backend can be swapped without touching components.
 */
export interface NotesRepository {
    readonly list: () => Promise<Note[]>;
    readonly create: (note: Note) => Promise<void>;
    readonly update: (id: NoteId, changes: NoteChanges) => Promise<void>;
    readonly remove: (id: NoteId) => Promise<void>;
}