import type { Metadata } from "next";
import { Balsamiq_Sans } from "next/font/google";
import { AuthProvider } from "../components/auth/AuthProvider";
import { HouseholdProvider } from "../components/household/HouseholdProvider";
import "./globals.css";

const balsamiq = Balsamiq_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-balsamiq",
});

export const metadata: Metadata = {
  title: "Dispensium",
  description: "Household dispensary management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${balsamiq.variable} h-full antialiased`}>
      <body className={balsamiq.className}>
        <AuthProvider>
          <HouseholdProvider>{children}</HouseholdProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
