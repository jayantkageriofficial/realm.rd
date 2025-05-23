import type { Metadata } from "next";
import "@/app/globals.css";
import "@mdxeditor/editor/style.css";
import Navbar from "@/components/misc/Navbar";
import Footer from "@/components/misc/Footer";
import Shortcut from "@/components/misc/Shortcut";
import { Toaster } from "react-hot-toast";
import logo from "@/assets/logo.svg";

export const metadata: Metadata = {
  title: "revamp.rd",
  description: "Scribble the plans, spill the thoughts.",
  icons: logo.src,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className="bg-primary">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#434343",
              color: "#fff",
              borderWidth: "0.01px",
              borderColor: "#919191",
              userSelect: "none",
              WebkitUserSelect: "none",
            },

            success: {
              iconTheme: {
                primary: "green",
                secondary: "white",
              },
            },

            error: {
              iconTheme: {
                primary: "red",
                secondary: "white",
              },
            },
          }}
        />
        <Navbar />
        {children}
        <Footer />
        <Shortcut />
      </body>
    </html>
  );
}
