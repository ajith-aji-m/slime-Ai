import type { Metadata, Viewport } from "next";
import { appFont, materialSymbols } from "@/lib/fonts";
import { site } from "@/config/site";
import { ThemeScript } from "@/components/providers/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
};

export const viewport: Viewport = {
  themeColor: "#dfeaf5",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${appFont.variable} ${materialSymbols.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full bg-background text-on-background antialiased">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
