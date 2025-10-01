import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProfileProvider } from "@/components/UserProfileContext";
import { SoundProvider } from "@/components/SoundContext";
import { ThemeProvider } from "@/components/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kinisi: Mindful Movement",
  description: "Track your movements and achieve more.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  // Add cache control for development
  ...(process.env.NODE_ENV === 'development' && {
    other: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent flash of white by immediately applying dark mode as default
              // The ThemeProvider will correct this after hydration
              try {
                const savedTheme = localStorage.getItem('kinisi_theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  // Default to dark for auto or dark theme
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {
                // Fallback to dark mode
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900`}>
        <ThemeProvider>
          <UserProfileProvider>
            <SoundProvider>
              {children}
            </SoundProvider>
          </UserProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
