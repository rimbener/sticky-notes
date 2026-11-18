import { describe, expect, it } from 'vitest';
import { fitRect, moveRect, rectFromPoints, resizeRect } from './geometry';

const bounds = { width: 1000, height: 800 };
const minSize = { width: 140, height: 100 };

describe('rectFromPoints', () => {
    it('works whatever direction the user drags in', () => {
        expect(rectFromPoints({ x: 300, y: 200 }, { x: 100, y: 50 })).toEqual({
            x: 100,
            y: 50,
            width: 200,
            height: 150,
        });
    });
});

describe('moveRect', () => {
    it('moves by the delta', () => {
        const rect = { x: 10, y: 10, width: 100, height: 100 };
        expect(moveRect(rect, { x: 5, y: -5 }, bounds)).toEqual({ ...rect, x: 15, y: 5 });
    });

    it('keeps the rect inside the bounds', () => {
        const rect = { x: 950, y: 10, width: 100, height: 100 };
        expect(moveRect(rect, { x: 500, y: -500 }, bounds)).toMatchObject({ x: 900, y: 0 });
    });
});

describe('resizeRect', () => {
    it('never goes below the minimum size', () => {
        const rect = { x: 0, y: 0, width: 200, height: 200 };
        expect(resizeRect(rect, { x: -500, y: -500 }, minSize, bounds)).toMatchObject(minSize);
    });

    it('never grows past the bounds', () => {
        const rect = { x: 900, y: 700, width: 50, height: 50 };
        expect(resizeRect(rect, { x: 999, y: 999 }, { width: 10, height: 10 }, bounds)).toMatchObject({
            width: 100,
            height: 100,
        });
    });
});

describe('fitRect', () => {
    it('grows small rects and pushes them back inside', () => {
        expect(fitRect({ x: 990, y: 790, width: 5, height: 5 }, minSize, bounds)).toEqual({
            x: 860,
            y: 700,
            width: 140,
            height: 100,
        });
    });
});

describe('fitRect on a smaller board', () => {
    it('shrinks a rect wider than the board so it can be moved and resized again', () => {
        expect(fitRect({ x: 400, y: 0, width: 1500, height: 100 }, minSize, bounds)).toEqual({
            x: 0,
            y: 0,
            width: 1000,
            height: 100,
        });
    });
});

describe('fitRect identity', () => {
    it('returns the same object when the rect already fits (keeps React.memo effective)', () => {
        const rect = { x: 10, y: 10, width: 200, height: 150 };
        expect(fitRect(rect, minSize, bounds)).toBe(rect);
    });
});