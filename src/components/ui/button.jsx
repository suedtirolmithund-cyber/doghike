import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[#F07030] text-white shadow-sm hover:bg-[#D4547A]",
        default:
          "bg-[#F07030] text-white shadow-sm hover:bg-[#D4547A]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-[#F07030] bg-transparent text-[#F07030] font-semibold shadow-sm hover:bg-[#F07030]/10 hover:text-[#F07030]",
        secondary:
          "bg-[#F9C030] text-[#7C4A00] shadow-sm hover:bg-[#F9C030]/80",
        soft:
          "bg-[#F9C030] text-[#7C4A00] shadow-sm hover:bg-[#F9C030]/80",
        ghost:
          "border border-[#F07030] bg-transparent text-[#F07030] font-semibold hover:bg-[#F07030]/10 hover:text-[#F07030]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-5 py-3",
        sm: "px-4 py-2 text-xs font-semibold",
        lg: "px-5 py-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, fullWidth = false, pill = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", pill && "rounded-full", className)}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
