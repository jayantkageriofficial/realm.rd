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

export default function Loading() {
  return (
    <div>
      <section id="loader">
        <div className="flex flex-row gap-2 justify-center items-center min-h-screen">
          <div className="w-4 h-4 rounded-full bg-quaternary animate-bounce" />
          <div className="w-4 h-4 rounded-full bg-quaternary animate-bounce [animation-delay:-.3s]" />
          <div className="w-4 h-4 rounded-full bg-quaternary animate-bounce [animation-delay:-.5s]" />
        </div>
      </section>
    </div>
  );
}
