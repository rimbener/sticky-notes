import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { Size } from '../domain/geometry';

/** The element's current size, kept up to date with a ResizeObserver. Null until measured. */
export function useElementSize(ref: RefObject<HTMLElement | null>): Size | null {
    const [size, setSize] = useState<Size | null>(null);

    useLayoutEffect(() => {
        const element = ref.current;
        if (element === null) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry !== undefined) {
                setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return size;
}