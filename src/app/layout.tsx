import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "iPhone Store POS",
  description: "Point of Sale system for iPhone retail store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
