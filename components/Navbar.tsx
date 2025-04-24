"use client";

import React from "react";
import Image from "next/image";
import logo from "@/assets/jayantkageri.png";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pages: {
    path: string;
    title: string;
  }[] = [
    {
      path: "todo",
      title: "Todo",
    },
    {
      path: "notes",
      title: "Notes",
    },
    {
      path: "pages",
      title: "Pages",
    },
  ];

  return (
    <>
      <nav className="relative rounded-full mt-2 mx-2 bg-secondary backdrop-blur-3xl backdrop-saturate-100 ">
        <div className="container px-6 py-2 mx-auto md:flex md:justify-between md:items-center">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image
                className="w-auto h-12 rounded-full"
                src={logo}
                alt="Logo"
              />
            </Link>

            <div className="flex md:hidden">
              <button
                type="button"
                className="text-gray-200 hover:text-gray-400 focus:outline-none focus:text-gray-400"
                aria-label="toggle menu"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-6 h-6 ${isOpen && "hidden"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 8h16M4 16h16"
                  />
                </svg>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-6 h-6 ${!isOpen && "hidden"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            className={`absolute bg-secondary rounded-4xl mt-5 inset-x-0 z-auto w-full px-6 py-4 transition-all duration-300 ease-in-out  md:mt-0 md:p-0 md:top-0 md:relative md:bg-transparent md:w-auto md:opacity-100 md:translate-x-0 md:flex md:items-center ${
              isOpen
                ? "translate-x-0 opacity-100"
                : "opacity-0 -translate-x-full"
            }`}
          >
            <div className="flex flex-col md:flex-row md:mx-4">
              {pages.map((page) => (
                <Link
                  key={page.path}
                  href={`/${page.path}`}
                  className="my-2 transition-colors duration-300 transform text-gray-100 hover:text-gray-300 md-hover-animation md:mx-4 md:my-0"
                >
                  {page.title}
                </Link>
              ))}
            </div>

            <div className="flex justify-center md:block">
              <Link
                className="relative transition-colors duration-300 transform text-gray-200 "
                href="/new"
              >
                <button className="bg-quaternary rounded-lg hover:bg-[#0087ca] cursor-pointer duration-300 transition-colors border border-transparent px-8 py-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
