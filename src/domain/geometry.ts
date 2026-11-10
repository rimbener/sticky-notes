export interface Point {
    readonly x: number;
    readonly y: number;
}

export interface Size {
    readonly width: number;
    readonly height: number;
}

export interface Rect extends Point, Size { }

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function subtractPoints(a: Point, b: Point): Point {
    return { x: a.x - b.x, y: a.y - b.y };
}

/** Keeps a point inside a box that starts at (0, 0). */
export function clampPoint(point: Point, bounds: Size): Point {
    return {
        x: clamp(point.x, 0, bounds.width),
        y: clamp(point.y, 0, bounds.height),
    };
}

export function containsPoint(rect: Rect, point: Point): boolean {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    );
}

export function rectsEqual(a: Rect, b: Rect): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/** The rectangle spanned by two corners, whatever direction the user dragged in. */
export function rectFromPoints(a: Point, b: Point): Rect {
    return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        width: Math.abs(a.x - b.x),
        height: Math.abs(a.y - b.y),
    };
}

/** Moves a rect by `delta`, keeping it fully inside `bounds`. */
export function moveRect(rect: Rect, delta: Point, bounds: Size): Rect {
    return {
        ...rect,
        x: clamp(rect.x + delta.x, 0, Math.max(0, bounds.width - rect.width)),
        y: clamp(rect.y + delta.y, 0, Math.max(0, bounds.height - rect.height)),
    };
}

/** Resizes from the bottom-right corner, respecting a minimum size and `bounds`. */
export function resizeRect(rect: Rect, delta: Point, minSize: Size, bounds: Size): Rect {
    return {
        ...rect,
        width: clamp(
            rect.width + delta.x,
            minSize.width,
            Math.max(minSize.width, bounds.width - rect.x),
        ),
        height: clamp(
            rect.height + delta.y,
            minSize.height,
            Math.max(minSize.height, bounds.height - rect.y),
        ),
    };
}

/**
 * Sizes a rect between `minSize` and `bounds`, then pushes it back inside `bounds`.
 * Returns the same object when nothing changes, so React.memo keeps working.
 */
export function fitRect(rect: Rect, minSize: Size, bounds: Size): Rect {
    const sized = {
        ...rect,
        width: clamp(rect.width, minSize.width, Math.max(minSize.width, bounds.width)),
        height: clamp(rect.height, minSize.height, Math.max(minSize.height, bounds.height)),
    };
    const fitted = moveRect(sized, { x: 0, y: 0 }, bounds);
    return rectsEqual(fitted, rect) ? rect : fitted;
}