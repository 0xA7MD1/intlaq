import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// التغيير هنا: الاستيراد من الحزمة مباشرة وليس من dist/types
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}