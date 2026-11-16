import { useId } from 'react';
import { cn } from '../../lib/utils.js';
import './ui.css';

/** Labeled range input with a live readout. `format` turns the value into text, e.g. (v) => `${v} %`. */
export default function Slider({ label, value, min = 0, max = 100, step = 1, onChange, format = String, className, ...props }) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('grid gap-1', className)}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <output htmlFor={id} className="text-muted tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={format(value)}
        className="arc-slider"
        style={{ '--fill': `${fill}%` }}
        {...props}
      />
    </div>
  );
}
