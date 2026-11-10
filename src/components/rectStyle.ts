import type { CSSProperties } from "react";
import type { Rect } from "../domain/geometry";

/** Position with transform (not layout when moving), size with width/height */
export function rectStyle(rect: Rect): CSSProperties {
    return {
        transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
        width: rect.width,
        height: rect.height
    }
}