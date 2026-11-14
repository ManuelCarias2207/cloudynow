import { CROPS, MAX_CROPS } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';

/** Multi-select of the crops in the current rotation (in planting order). */
export default function CropStep({ value, onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((crop) => crop !== id));
    else if (value.length < MAX_CROPS) onChange([...value, id]);
  };
  return (
    <section>
      <h2 className="font-medium">What do you plant now?</h2>
      <p className="mb-3 text-sm text-zinc-500">Pick 1 to {MAX_CROPS} crops of your current rotation.</p>
      <div className="flex flex-wrap gap-2">
        {CROPS.map((crop) => {
          const active = value.includes(crop.id);
          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => toggle(crop.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm ring-1 transition',
                active ? 'bg-zinc-900 text-white ring-zinc-900' : 'bg-white ring-zinc-200 hover:bg-zinc-100',
              )}
            >
              {crop.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
