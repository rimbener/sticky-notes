import { Board } from './components/Board/Board';
import { useNotes } from './state/useNotes';

export function App() {
  const { notes, commands } = useNotes();
  return <Board notes={notes} commands={commands} />;
}