import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ChatSessionsProvider } from "@/hooks/use-chat-sessions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NK Chat - Formula 1 AI Assistant",
  description:
    "An advanced AI chatbot powered by OpenAI specialized in Formula 1 racing knowledge and information.",
  keywords: ["Formula 1", "F1", "Racing", "AI", "Chatbot", "OpenAI"],
  authors: [{ name: "Nicholas Klos" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ChatSessionsProvider>{children}</ChatSessionsProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
