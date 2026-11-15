import { cn } from '../../lib/utils.js';

export default function Card({ className, ...props }) {
  return <div className={cn('rounded-lg bg-surface p-5 ring-1 ring-line', className)} {...props} />;
}
