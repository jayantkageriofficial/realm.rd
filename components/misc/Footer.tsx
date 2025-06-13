/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

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

import React from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.svg";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <>
      <footer className="bg-secondary rounded-full mx-2 mb-2 py-4 select-none">
        <div className="flex items-center flex-row justify-start">
          <Link href={"/"} className="ml-5">
            <Image
              className="h-4 md:h-5 w-auto scale-150 md:scale-125"
              src={logo}
              alt="Logo"
            />
          </Link>
          <p className="text-sm text-gray-300 px-4">
            © {year == 2025 ? 2025 : `2025 - ${year}`}{" "}
            <a
              href="https://jayantkageri.in"
              target="_blank"
              rel="noreferrer noopener"
              className={`transition-colors duration-300 transform copyright-hover-animation`}
              tabIndex={-1}
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
