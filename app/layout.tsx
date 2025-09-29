import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { SoundProvider } from "@/components/SoundContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kinisi: Mindful Movement",
  description: "Track your movements and achieve more.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent flash of white by immediately applying dark mode
              (function() {
                const savedTheme = localStorage.getItem('kinisi_theme') || 'auto';
                if (savedTheme === 'dark' || (savedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900`}>
        <ThemeProvider>
          <SoundProvider>
            {children}
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
