"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useClickAway } from "react-use";
import { usePathname } from "next/navigation";
import logo from "@/assets/jayantkageri.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef(null);
  useClickAway(ref, () => {
    if (isOpen) setIsOpen(false);
  });

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
      path: "page",
      title: "Pages",
    },
  ];

  const path = usePathname();

  return (
    <>
      <nav
        className="relative rounded-full mt-2 mx-2 bg-secondary select-none"
        ref={ref}
      >
        <div className="px-6 py-2 mx-auto md:flex md:justify-between md:items-center">
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
            hidden={"/auth/login" == path || "/locked" == path}
          >
            <div className="flex flex-col md:flex-row md:mx-4">
              {pages.map((page) => (
                <Link
                  key={page.path}
                  href={`/${page.path}`}
                  className={`my-2 transition-colors duration-300 transform text-gray-100 hover:text-gray-300 md-hover-animation ${
                    `/${page.path}` == path &&
                    "underline-offset-4 underline decoration-red-600"
                  } md:mx-4 md:my-0`}
                >
                  {page.title}
                </Link>
              ))}
            </div>

            <div className="flex justify-center md:block">
              <a
                className="relative transition-colors duration-300 transform text-gray-200 "
                href={`/auth/logout?path=${path}`}
              >
                <div className="bg-quaternary rounded-full hover:bg-red-600 cursor-pointer duration-300 transition-colors border border-transparent p-2">
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
                      d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                    />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
