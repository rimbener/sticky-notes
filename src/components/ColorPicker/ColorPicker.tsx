import { NOTE_COLORS } from '../../domain/note';
import type { NoteColor } from '../../domain/note';
import './ColorPicker.css';

interface ColorPickerProps {
    readonly value: NoteColor;
    readonly onChange: (color: NoteColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    return (
        <div className="color-picker" role="group" aria-label="Note color">
            {NOTE_COLORS.map((color) => (
                <button
                    key={color}
                    type="button"
                    aria-pressed={color === value}
                    aria-label={color}
                    className="color-picker__swatch"
                    data-color={color}
                    // Pressing a swatch must not start dragging the note. The gaps between swatches still can.
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => {
                        if (color !== value) onChange(color);
                    }}
                />
            ))}
        </div>
    );
}