import { cn } from '../../lib/utils.js';

/** Fades and lifts its content in. Give it `key={pathname}` to animate step changes; `index` staggers siblings. */
export default function Reveal({ as: Tag = 'div', index = 0, className, style, ...props }) {
  return <Tag className={cn('animate-enter', className)} style={{ animationDelay: `${index * 60}ms`, ...style }} {...props} />;
}
