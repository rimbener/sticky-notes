import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { clampPoint } from '../../domain/geometry';
import type { Point, Rect, Size } from '../../domain/geometry';
import { noteRectFromDrag } from '../../domain/note';
import type { Note, NoteId } from '../../domain/note';
import { startPointerDrag } from '../../interaction/pointerDrag';
import type { NotesCommands } from '../../state/useNotes';
import { rectStyle } from '../rectStyle';
import { StickyNote } from '../StickyNote/StickyNote';
import { classNames } from '../../utils/classNames';
import './Board.css';

/** What the user is doing right now. Only one gesture can be active at a time. */
type Interaction =
    | { readonly kind: 'idle' }
    | { readonly kind: 'creating'; readonly rect: Rect | null }
    | { readonly kind: 'moving'; readonly noteId: NoteId; readonly rect: Rect; readonly overTrash: boolean }
    | { readonly kind: 'resizing'; readonly noteId: NoteId; readonly rect: Rect };

const IDLE: Interaction = { kind: 'idle' };

/** Where the board is on screen, measured once per gesture. */
interface BoardFrame {
    readonly origin: Point;
    readonly bounds: Size;
}

function measureBoard(element: HTMLElement): BoardFrame {
    const box = element.getBoundingClientRect();
    return {
        origin: { x: box.left, y: box.top },
        bounds: { width: box.width, height: box.height },
    };
}

function toBoardPoint(event: { clientX: number; clientY: number }, frame: BoardFrame): Point {
    return { x: event.clientX - frame.origin.x, y: event.clientY - frame.origin.y };
}

interface GestureCallbacks {
    readonly onMove: (event: PointerEvent) => void;
    readonly onDrop: (event: PointerEvent) => void;
}

interface BoardProps {
    readonly notes: readonly Note[];
    readonly commands: NotesCommands;
}

export function Board({ notes, commands }: BoardProps) {
    const boardRef = useRef<HTMLDivElement>(null);
    const stopDragRef = useRef<(() => void) | null>(null);
    const [interaction, setInteraction] = useState<Interaction>(IDLE);

    // If the board unmounts mid-drag, remove the window listeners.
    useEffect(() => () => stopDragRef.current?.(), []);

    const beginGesture = useCallback(
        (event: ReactPointerEvent<HTMLElement>, initial: Interaction, callbacks: GestureCallbacks) => {
            event.preventDefault(); // no text selection, no native drag-and-drop
            stopDragRef.current?.();
            setInteraction(initial);
            stopDragRef.current = startPointerDrag(event.nativeEvent, event.currentTarget, {
                onMove: callbacks.onMove,
                onEnd: (endEvent) => {
                    stopDragRef.current = null;
                    setInteraction(IDLE);
                    callbacks.onDrop(endEvent);
                },
                onCancel: () => {
                    stopDragRef.current = null;
                    setInteraction(IDLE);
                },
            });
        },
        [],
    );

    const handleBoardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        // Only primary-button presses on empty board space start a new note.
        if (event.button !== 0 || event.target !== event.currentTarget) return;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

        const frame = measureBoard(event.currentTarget);
        const origin = clampPoint(toBoardPoint(event, frame), frame.bounds);
        const draft = (pointer: PointerEvent) =>
            noteRectFromDrag(origin, clampPoint(toBoardPoint(pointer, frame), frame.bounds), frame.bounds);

        beginGesture(event, { kind: 'creating', rect: null }, {
            onMove: (pointer) => setInteraction({ kind: 'creating', rect: draft(pointer) }),
            onDrop: (pointer) => {
                const rect = draft(pointer);
                if (rect !== null) commands.createNote(rect);
            },
        });
    };

    return (
        <div
            ref={boardRef}
            className={classNames('board', interaction.kind !== 'idle' && 'board--busy')}
            onPointerDown={handleBoardPointerDown}
        >
            <div className="board__layer">
                {notes.map((note) => (
                    <StickyNote key={note.id} note={note} rect={note.rect} />
                ))}
            </div>

            {interaction.kind === 'creating' && interaction.rect !== null && (
                <div className="board__draft" style={rectStyle(interaction.rect)} />
            )}

            {notes.length === 0 && interaction.kind === 'idle' && (
                <p className="board__hint">Drag anywhere on the board to create a note</p>
            )}
        </div>
    );
}