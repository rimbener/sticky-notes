/** Joins the thruthy class names: classNames('note', is Dragging && 'not-dragging) */
export function classNames(...names: ReadonlyArray<string | false>): string {
    return names.filter(Boolean).join(' ')
}