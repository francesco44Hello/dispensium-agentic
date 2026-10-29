import type { Metadata } from "next";
import { Balsamiq_Sans } from "next/font/google";
import { AuthProvider } from "../components/auth/AuthProvider";
import { LocaleProvider } from "../components/i18n/LocaleProvider";
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
  icons: {
    icon: [{ url: "/brand/mark.svg", type: "image/svg+xml" }],
    apple: "/icons/apple-touch-icon-v2.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${balsamiq.variable} h-full antialiased`}>
      <body className={balsamiq.className}>
        <LocaleProvider>
          <AuthProvider>
            <HouseholdProvider>{children}</HouseholdProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
