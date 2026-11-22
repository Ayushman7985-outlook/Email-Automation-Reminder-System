import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseMail — Automation Workspace",
  description: "Email automation and reminder management dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
