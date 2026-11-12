import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getSiteUrl } from "../lib/site-url.mjs";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "ToolNest — Free tools for everything you do", template: "%s | ToolNest" },
  description: "Free browser-based tools for images, PDFs and text. Process files on your device with no account required.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  verification: {
    google: "o73Px4W-7T57QBuTPi7yFmI9sN_9SNlnR_WB_QkVDMQ",
  },
  openGraph: { title: "ToolNest — Free tools for everything you do", description: "Free browser-based tools for images, PDFs and text.", siteName: "ToolNest", url: "/", type: "website", locale: "en_US" },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><Header /><main id="main-content">{children}</main><Footer /></body></html>;
}
