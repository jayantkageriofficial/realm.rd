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

"use client";

import Link from "next/link";
import React from "react";
import { getNotes } from "@/lib/actions/notes";
import type { Notes } from "@/lib/database/schema";

export default function NotesComponent(props: {
	total: number;
	init: Notes[];
}) {
	const [info, setInfo] = React.useState<{
		total: number;
		page: number;
		notes: Notes[];
		loading: boolean;
	}>({
		total: props.total,
		page: 1,
		notes: props.init,
		loading: false,
	});
	return (
		<>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold capitalize lg:text-3xl text-white">
					Recent <span className="text-red-600">Notes</span> (
					{info.notes.length}/{info.total})
				</h1>

				<Link href={"/notes/new"}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-8 text-red-600 rounded-full hover:text-blue-400 transition-all"
					>
						<title>Add Note Icon</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
				</Link>
			</div>

			<hr className="mt-3 mb-8 border-gray-700" />

			<div className="grid md:grid-cols-2 gap-4">
				{info.notes.map((note) => (
					<Link
						key={note.id}
						href={`/notes/${note.id}`}
						className="w-full h-48 md:h-52 px-8 py-4 rounded-lg shadow-md border-2 border-secondary hover:border-blue-700 transition-all transform-border overflow-hidden"
					>
						<div className="flex items-center justify-between">
							<span className="text-sm font-light text-gray-200">
								{note.timestamp?.toDateString()}
							</span>
						</div>

						<div className="mt-2">
							<span className="text-xl font-bold text-white underline">
								{note.title}
							</span>
							<p className="mt-2 text-gray-300">
								{note.content?.length > 140
									? `${note.content?.slice(0, 140)}...`
									: note.content}
							</p>
						</div>
					</Link>
				))}
			</div>

			{info.total !== info.notes.length && (
				<div className="flex justify-end">
					<button
						className={`px-6 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform rounded-lg bg-red-600 hover:bg-red-500 focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-80 justify-center ${
							info.loading ? "cursor-not-allowed" : "cursor-pointer"
						}`}
						disabled={info.loading}
						type="button"
						onClick={async (e) => {
							e.preventDefault();
							setInfo({
								...info,
								loading: true,
							});
							const notes = await getNotes(++info.page);
							setInfo({
								...info,
								notes: JSON.parse(notes),
								page: ++info.page,
								loading: false,
							});
						}}
					>
						Load more
					</button>
				</div>
			)}
		</>
	);
}
