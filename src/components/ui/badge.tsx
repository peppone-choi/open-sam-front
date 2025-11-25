import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-600/80 border-transparent",
        secondary:
          "bg-white/10 text-gray-200 hover:bg-white/20 border-transparent",
        destructive:
          "bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30",
        outline: "text-gray-300 border border-white/20",
        success:
            "bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
