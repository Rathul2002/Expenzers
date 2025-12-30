import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Expense Calculator",
    description: "Premium Credit Card Expense Tracker",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen antialiased selection:bg-purple-500/30`}>
                <div className="fixed inset-0 -z-10 h-full w-full bg-[#0a0a0a]">
                    {/* Ambient Background Glows */}
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
                </div>
                {children}
            </body>
        </html>
    );
}
