import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT } from "@/lib/site-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "JSG Games",
  description: "A shared home for JSG game experiences.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script id="jsg-theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
