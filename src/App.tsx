import { Board } from './components/Board/Board';
import { createLocalStorageRepository } from './persistence/localStorageRepository';
import { useNotes } from './state/useNotes';

// Created once, outside React: a stable dependency for useNotes.
const repository = createLocalStorageRepository();

export function App() {
  const { status, notes, commands } = useNotes(repository);
  return <Board notes={notes} commands={commands} disabled={status !== 'ready'} />;
}