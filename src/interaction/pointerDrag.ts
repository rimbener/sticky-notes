export interface PointerDragHandlers {
    /** Every pointer move while the drag is active. */
    readonly onMove: (event: PointerEvent) => void;
    /** The pointer was released: commit the result. */
    readonly onEnd: (event: PointerEvent) => void;
    /** Escape, pointercancel, window blur or a context menu: throw the result away. */
    readonly onCancel: () => void;
}

/**
 * Follows one pointer from pointerdown until it is released or the drag is cancelled.
 * Returns a function that stops listening without calling any handler (for unmount).
 */
export function startPointerDrag(
    startEvent: PointerEvent,
    captureTarget: Element,
    handlers: PointerDragHandlers,
): () => void {
    const { pointerId } = startEvent;

    // Capture: we keep getting events even if the pointer leaves the element or the window.
    try {
        captureTarget.setPointerCapture(pointerId);
    } catch {
        // The pointer is already gone (e.g. released in the same frame). Window listeners still work.
    }

    const onPointerMove = (event: PointerEvent) => {
        if (event.pointerId === pointerId) handlers.onMove(event);
    };
    const onPointerUp = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        stop();
        handlers.onEnd(event);
    };
    const onPointerCancel = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        stop();
        handlers.onCancel();
    };
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        stop();
        handlers.onCancel();
    };
    // Window blur (alt-tab) and context menus (e.g. ctrl+click on macOS) can swallow pointerup.
    const onInterrupt = () => {
        stop();
        handlers.onCancel();
    };

    function stop(): void {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('blur', onInterrupt);
        window.removeEventListener('contextmenu', onInterrupt);
        if (captureTarget.hasPointerCapture(pointerId)) {
            captureTarget.releasePointerCapture(pointerId);
        }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onInterrupt);
    window.addEventListener('contextmenu', onInterrupt);

    return stop;
}