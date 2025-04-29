import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <>
      <footer className="bg-secondary rounded-full mx-2 mb-2 py-4 select-none">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-300 px-4">
            © {year == 2025 ? 2025 : `2025 - ${year}`}{" "}
            <a
              href="https://jayantkageri.in"
              target="_blank"
              rel="noreferrer noopener"
              className={`transition-colors duration-300 transform copyright-hover-animation`}
            >
              Jayant Hegde Kageri
            </a>
            , All Rights Reserved
          </p>
        </div>
      </footer>
    </>
  );
}
