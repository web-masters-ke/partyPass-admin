import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#D93B2F] text-white",
        secondary: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
        outline: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
        success: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
        warning: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
        destructive: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
        info: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
        draft: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
        published: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
        ongoing: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
        cancelled: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
        past: "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
        presale: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
        sold_out: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
        postponed: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
        // tier badges
        bronze: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
        silver: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
        gold: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
        platinum: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
        diamond: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
        // role badges
        admin: "bg-[#D93B2F]/10 text-[#D93B2F]",
        organizer: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
        attendee: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
