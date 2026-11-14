import { cn } from '../../lib/utils.js';

export default function Card({ className, ...props }) {
  return <div className={cn('rounded-2xl bg-white p-5 ring-1 ring-zinc-200', className)} {...props} />;
}
