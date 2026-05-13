import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Ultimate AI Career Agent",
  description:
    "AI-powered career analysis, job matching, and virtual interview preparation platform",
  keywords: "AI, career, interview, CV analysis, job matching",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-[#09090b]">{children}</div>
      </body>
    </html>
  );
}
