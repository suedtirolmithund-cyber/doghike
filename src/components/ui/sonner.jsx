"use client";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    (<Sonner
      theme={theme}
      className="toaster group"
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-brand-100/80 group-[.toaster]:bg-white/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-[0_18px_40px_rgba(168,0,60,0.12)] backdrop-blur-xl rounded-2xl",
          title: "text-[#7C3020] font-semibold",
          description: "text-[#C07820]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props} />)
  );
}

export { Toaster }
