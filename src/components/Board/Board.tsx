import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
    clampPoint,
    containsPoint,
    fitRect,
    moveRect,
    rectsEqual,
    resizeRect,
    subtractPoints,
} from '../../domain/geometry';
import type { Point, Rect, Size } from '../../domain/geometry';
import { MIN_NOTE_SIZE, noteRectFromDrag } from '../../domain/note';
import type { Note, NoteId } from '../../domain/note';
import { useElementSize } from '../../hooks/useElementSize';
import { startPointerDrag } from '../../interaction/pointerDrag';
import type { NotesCommands } from '../../state/useNotes';
import { rectStyle } from '../rectStyle';
import { StickyNote } from '../StickyNote/StickyNote';
import { TrashZone } from '../TrashZone/TrashZone';
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
    readonly disabled: boolean;
}

export function Board({ notes, commands, disabled }: BoardProps) {
    const boardRef = useRef<HTMLDivElement>(null);
    const trashRef = useRef<HTMLDivElement>(null);
    const stopDragRef = useRef<(() => void) | null>(null);
    const [interaction, setInteraction] = useState<Interaction>(IDLE);
    const boardSize = useElementSize(boardRef);

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
        if (disabled || event.button !== 0 || event.target !== event.currentTarget) return;
        // The trash lets clicks through (pointer-events: none), so ignore presses on it here.
        const trash = trashRef.current;
        if (trash !== null && containsPoint(trash.getBoundingClientRect(), { x: event.clientX, y: event.clientY })) {
            return;
        }
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

    const handleMoveStart = useCallback(
        (note: Note, event: ReactPointerEvent<HTMLElement>) => {
            const board = boardRef.current;
            const trash = trashRef.current;
            if (event.button !== 0 || board === null || trash === null) return;

            const frame = measureBoard(board);
            const trashBox = trash.getBoundingClientRect();
            const start = toBoardPoint(event, frame);
            const startRect = fitRect(note.rect, MIN_NOTE_SIZE, frame.bounds); // what the user sees
            const previewAt = (pointer: PointerEvent) => ({
                rect: moveRect(startRect, subtractPoints(toBoardPoint(pointer, frame), start), frame.bounds),
                overTrash: containsPoint(trashBox, { x: pointer.clientX, y: pointer.clientY }),
            });

            beginGesture(event, { kind: 'moving', noteId: note.id, rect: startRect, overTrash: false }, {
                onMove: (pointer) => setInteraction({ kind: 'moving', noteId: note.id, ...previewAt(pointer) }),
                onDrop: (pointer) => {
                    const { rect, overTrash } = previewAt(pointer);
                    if (overTrash) commands.deleteNote(note.id);
                    else if (!rectsEqual(rect, startRect)) commands.setNoteRect(note.id, rect);
                },
            });
        },
        [beginGesture, commands],
    );

    const handleResizeStart = useCallback(
        (note: Note, event: ReactPointerEvent<HTMLElement>) => {
            const board = boardRef.current;
            if (event.button !== 0 || board === null) return;

            const frame = measureBoard(board);
            const start = toBoardPoint(event, frame);
            const startRect = fitRect(note.rect, MIN_NOTE_SIZE, frame.bounds); // what the user sees
            const previewAt = (pointer: PointerEvent) =>
                resizeRect(startRect, subtractPoints(toBoardPoint(pointer, frame), start), MIN_NOTE_SIZE, frame.bounds);

            beginGesture(event, { kind: 'resizing', noteId: note.id, rect: startRect }, {
                onMove: (pointer) => setInteraction({ kind: 'resizing', noteId: note.id, rect: previewAt(pointer) }),
                onDrop: (pointer) => {
                    const rect = previewAt(pointer);
                    if (!rectsEqual(rect, startRect)) commands.setNoteRect(note.id, rect);
                },
            });
        },
        [beginGesture, commands],
    );

    const active = interaction.kind === 'moving' || interaction.kind === 'resizing' ? interaction : null;
    const isMoving = interaction.kind === 'moving';
    const isOverTrash = interaction.kind === 'moving' && interaction.overTrash;
    // Notes saved on a bigger window are pulled back on screen (display only, not saved).
    const visibleRect = (note: Note): Rect =>
        boardSize === null ? note.rect : fitRect(note.rect, MIN_NOTE_SIZE, boardSize);

    return (
        <div
            ref={boardRef}
            className={classNames('board', interaction.kind !== 'idle' && 'board--busy')}
            onPointerDown={handleBoardPointerDown}
        >
            <div className="board__layer">
                {notes.map((note) => {
                    const isActive = active !== null && active.noteId === note.id;
                    return (
                        <StickyNote
                            key={note.id}
                            note={note}
                            rect={isActive ? active.rect : visibleRect(note)}
                            isDragging={isActive}
                            isOverTrash={isActive && isOverTrash}
                            onMoveStart={handleMoveStart}
                            onResizeStart={handleResizeStart}
                            onTextChange={commands.setNoteText}
                            onActivate={commands.bringToFront}
                            onColorChange={commands.setNoteColor}
                        />
                    );
                })}
            </div>

            {interaction.kind === 'creating' && interaction.rect !== null && (
                <div className="board__draft" style={rectStyle(interaction.rect)} />
            )}

            {notes.length === 0 && interaction.kind === 'idle' && !disabled && (
                <p className="board__hint">Drag anywhere on the board to create a note</p>
            )}

            <TrashZone ref={trashRef} isArmed={isMoving} isHovered={isOverTrash} />
        </div>
    );
}