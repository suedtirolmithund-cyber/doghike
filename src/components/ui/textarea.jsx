import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-brand-100/75 bg-white/72 px-4 py-3 text-base text-[#7C3020] shadow-sm backdrop-blur-sm placeholder:text-[#7C3020]/58 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8003C]/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
