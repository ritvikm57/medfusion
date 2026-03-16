import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const displaySans = Space_Grotesk({
  variable: "--font-display-sans",
  subsets: ["latin"],
});

const bodyMono = IBM_Plex_Mono({
  variable: "--font-body-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata = {
  title: "MedFusion | Disease Surveillance Dashboard",
  description: "Live multi-source disease and regional surveillance dashboard for hackathon use.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${displaySans.variable} ${bodyMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
