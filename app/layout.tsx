/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import type { Metadata } from "next";
import "@/app/globals.css";
import "@mdxeditor/editor/style.css";
import { Toaster } from "react-hot-toast";
import logo from "@/assets/logo.svg";
import Footer from "@/components/misc/Footer";
import Navbar from "@/components/misc/Navbar";
import Utils from "@/components/misc/Utils";

export const metadata: Metadata = {
  title: { default: "realm.rd", template: "%s | realm.rd" },
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
        <Utils />
      </body>
    </html>
  );
}
