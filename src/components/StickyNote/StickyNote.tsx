import { memo } from 'react';
import type { Rect } from '../../domain/geometry';
import type { Note } from '../../domain/note';
import { rectStyle } from '../rectStyle';
import './StickyNote.css';

interface StickyNoteProps {
  readonly note: Note;
  /** Where to draw the note. Differs from note.rect while it is being dragged. */
  readonly rect: Rect;
}

function StickyNoteComponent({ rect }: StickyNoteProps) {
  return (
    <article className="note" style={rectStyle(rect)}>
      <header className="note__header">
        <span className="note__grip" aria-hidden="true" />
      </header>
      <div className="note__body" />
      <div className="note__resize" aria-hidden="true" />
    </article>
  );
}

/** Memoized: while one note is dragged, the others don't re-render. */
export const StickyNote = memo(StickyNoteComponent);