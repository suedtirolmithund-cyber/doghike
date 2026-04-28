import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-white/55 bg-white/48 px-4 py-1 text-base text-[#3f2f26] shadow-sm backdrop-blur-md transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#9a6c58]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c46f52]/35 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
