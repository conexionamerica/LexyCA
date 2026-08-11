import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm',
        secondary:
          'border-transparent bg-teal-100 text-teal-800',
        destructive:
          'border-transparent bg-red-100 text-red-700',
        outline:
          'border-cyan-200 text-cyan-700 bg-white/60 backdrop-blur-sm',
        success:
          'border-transparent bg-emerald-100 text-emerald-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
