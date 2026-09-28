"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "w-full rounded-none border-none text-white flex justify-center text-center text-sm font-medium tracking-wide px-4 py-3 min-w-full m-0",
          error: "bg-destructive",
          success: "bg-mint",
          default: "bg-foreground",
          title: "text-center w-full",
        },
        style: {
          width: "100%",
          maxWidth: "100%",
        },
      }}
      style={{
        width: "100%",
        left: 0,
        right: 0,
        top: 0,
        padding: 0,
      }}
    />
  );
}
