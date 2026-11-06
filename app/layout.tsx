import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./extra.css";
import "./charts.css";
import { SwRegister } from "@/components/SwRegister";
import { ConnectionWatcher } from "@/components/ConnectionWatcher";

// next/font downloads these at build time and serves them from the app itself,
// so the design looks the same without internet.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });
const hind = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-hind", display: "swap" });

export const metadata: Metadata = {
  title: "Shikhon Coaching",
  description: "Job preparation coaching — students, attendance, exams, progress",
  manifest: "/manifest.json",
};

export const viewport: Viewport = { themeColor: "#0b1020", width: "device-width", initialScale: 1, viewportFit: "cover" };

// applied before paint so dark mode never flashes
const themeInit = `try{var t=localStorage.getItem("cm-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");if(!navigator.onLine)document.documentElement.classList.add("is-offline")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" className={`${jakarta.variable} ${hind.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <ConnectionWatcher />
        <SwRegister />
      </body>
    </html>
  );
}
