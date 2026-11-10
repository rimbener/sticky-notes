import { applyChanges } from '../domain/note';
import type { Note } from '../domain/note';
import type { NotesRepository } from './NotesRepository';
import { parseNotes } from './parseNotes';

export function createLocalStorageRepository(storageKey = 'sticky-notes/v1'): NotesRepository {
    function read(): Note[] {
        try {
            const raw = localStorage.getItem(storageKey);
            return raw === null ? [] : parseNotes(JSON.parse(raw));
        } catch {
            // Corrupted JSON or storage disabled: start with an empty board instead of crashing.
            return [];
        }
    }

    function write(notes: readonly Note[]): void {
        localStorage.setItem(storageKey, JSON.stringify(notes));
    }

    return {
        async list() {
            return read();
        },
        async create(note) {
            write([...read(), note]);
        },
        async update(id, changes) {
            write(read().map((note) => (note.id === id ? applyChanges(note, changes) : note)));
        },
        async remove(id) {
            write(read().filter((note) => note.id !== id));
        },
    };
}