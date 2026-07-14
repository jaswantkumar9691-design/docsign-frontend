import "./globals.css";

export const metadata = {
  title: "DocSign — Secure Document Signing",
  description: "Upload, sign, share, and audit PDF documents.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
