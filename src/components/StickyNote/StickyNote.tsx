import { memo } from 'react';
import type { Rect } from '../../domain/geometry';
import type { Note } from '../../domain/note';
import { rectStyle } from '../rectStyle';
import './StickyNote.css';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { classNames } from '../../utils/classNames';

interface StickyNoteProps {
  readonly note: Note;
  /** Where to draw the note. Differs from note.rect while it is being dragged. */
  readonly rect: Rect;
  readonly isDragging: boolean;
  readonly onMoveStart: (note: Note, event: ReactPointerEvent<HTMLElement>) => void;
  readonly onResizeStart: (note: Note, event: ReactPointerEvent<HTMLElement>) => void;
}

function StickyNoteComponent({ note, rect, isDragging, onMoveStart, onResizeStart }: StickyNoteProps) {
  const className = classNames('note', isDragging && 'note--dragging');

  return (
    <article className={className} style={rectStyle(rect)}>
      <header className="note__header" onPointerDown={event => onMoveStart(note, event)}>
        <span className="note__grip" aria-hidden="true" />
      </header>
      <div className="note__body" />
      <div
        className="note__resize"
        aria-hidden="true"
        onPointerDown={(event) => onResizeStart(note, event)}
      />
    </article>
  );
}

/** Memoized: while one note is dragged, the others don't re-render. */
export const StickyNote = memo(StickyNoteComponent);