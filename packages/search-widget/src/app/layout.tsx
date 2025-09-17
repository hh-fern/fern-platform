import type { Metadata } from "next";
import { Provider } from "jotai";
import "./globals.css";

export const metadata: Metadata = {
  title: "Search Widget Test Environment",
  description: "Testing environment for Fern search widget components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}