import type { Ref } from 'react';
import { classNames } from '../../utils/classNames';
import './TrashZone.css';

interface TrashZoneProps {
    readonly ref: Ref<HTMLDivElement>;
    /** A note is being dragged, so the trash is a possible target. */
    readonly isArmed: boolean;
    /** The pointer is over the trash: releasing now deletes the note. */
    readonly isHovered: boolean;
}

export function TrashZone({ ref, isArmed, isHovered }: TrashZoneProps) {
    const className = classNames('trash', isArmed && 'trash--armed', isHovered && 'trash--hovered');

    return (
        <div ref={ref} className={className} aria-hidden="true">
            <svg className="trash__icon" viewBox="0 0 24 24" width="28" height="28">
                <path
                    d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h1.5v-8H10Zm2.5 0v8H14v-8h-1.5Z"
                    fill="currentColor"
                />
            </svg>
            <span>{isHovered ? 'Release to delete' : 'Drop to delete'}</span>
        </div>
    );
}