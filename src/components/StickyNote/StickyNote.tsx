import type { PointerEvent as ReactPointerEvent } from 'react';
import { memo } from 'react';
import type { Rect } from '../../domain/geometry';
import type { Note, NoteId } from '../../domain/note';
import { classNames } from '../../utils/classNames';
import { rectStyle } from '../rectStyle';
import './StickyNote.css';

interface StickyNoteProps {
  readonly note: Note;
  /** Where to draw the note. Differs from note.rect while it is being dragged. */
  readonly rect: Rect;
  readonly isDragging: boolean;
  readonly isOverTrash: boolean;
  readonly onTextChange: (id: NoteId, text: string) => void;
  readonly onMoveStart: (note: Note, event: ReactPointerEvent<HTMLElement>) => void;
  readonly onResizeStart: (note: Note, event: ReactPointerEvent<HTMLElement>) => void;
}

function StickyNoteComponent({
  note,
  rect,
  isDragging,
  isOverTrash,
  onTextChange,
  onMoveStart,
  onResizeStart,
}: StickyNoteProps) {
  const className = classNames(
    'note',
    isDragging && 'note--dragging',
    isOverTrash && 'note--over-trash',
  );

  return (
    <article className={className} style={rectStyle(rect)}>
      <header className="note__header" onPointerDown={(event) => onMoveStart(note, event)}>
        <span className="note__grip" aria-hidden="true" />
      </header>
      <textarea
        className="note__text"
        value={note.text}
        placeholder="Write something…"
        aria-label="Note text"
        onChange={(event) => onTextChange(note.id, event.target.value)}
      />
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