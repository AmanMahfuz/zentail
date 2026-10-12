import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaBody = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zentail — Secure your next job",
  description: "The intelligent job application tracker and AI resume matcher.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${plusJakartaBody.variable} ${ibmPlexMono.variable} h-full`}
    >
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "flex items-start gap-3 w-full bg-white border border-slate-200 shadow-sm rounded-xl p-4 font-sans",
              title: "text-[14px] font-bold text-slate-900 mb-1",
              description: "text-[13px] text-slate-600",
              icon: "w-5 h-5 mt-0.5",
              actionButton: "bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-blue-700 transition-colors ml-auto shrink-0",
              cancelButton: "bg-slate-100 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 transition-colors ml-auto shrink-0",
              error: "border-red-100 bg-white text-red-600",
              success: "border-emerald-100 bg-white text-emerald-600",
              warning: "border-amber-100 bg-white text-amber-600",
              info: "border-blue-100 bg-white text-blue-600"
            }
          }}
        />
      </body>
    </html>
  );
}
