import type { Metadata } from "next";
import "./globals.css";
import "./neuracore.css";

export const metadata: Metadata = {
  title: "DomusVita Pflegeabrechnung",
  description: "Automatische Korrekturrechnung für BA/PK mit OCR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
