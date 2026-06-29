import type { Metadata } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700', '800'],
  subsets: ["latin"], 
  variable: "--font-sans" 
});
const poppinsHeading = Poppins({ 
  weight: ['400', '500', '600', '700', '800'],
  subsets: ["latin"], 
  variable: "--font-heading" 
});
const ibmMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduSphere 360 AlphaV1",
  description: "AI-Powered International School Management Platform",
};

import { ThemeProvider } from "@/components/ui/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${poppins.variable} ${poppinsHeading.variable} ${ibmMono.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
