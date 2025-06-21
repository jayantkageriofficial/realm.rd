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

import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Card,
	Divider,
	Flex,
	Grid,
	Group,
	MantineProvider,
	MantineThemeOverride,
	Menu,
	Modal,
	NumberInput,
	Paper,
	SegmentedControl,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { createMonth, getMonths } from "@/lib/actions/exp";
import type { Expenditure } from "@/lib/database/schema";

const theme: MantineThemeOverride = {
	colorScheme: "dark",
	colors: {
		dark: [
			"#C1C2C5",
			"#A6A7AB",
			"#909296",
			"#5c5f66",
			"#373A40",
			"#2C2E33",
			"#25262b",
			"#1A1B1E",
			"#141517",
			"#101113",
		],
	},
};
const NewMonthModal = ({
	opened,
	onClose,
	onCreate,
}: {
	opened: boolean;
	onClose: () => void;
	onCreate: (month: string) => void;
}) => {
	const [month, setMonth] = React.useState("");

	const handleCreate = () => {
		onCreate(month);
		setMonth("");
	};

	return (
		<MantineProvider theme={theme}>
			<Modal opened={opened} onClose={onClose} title="Add New Month" centered>
				<Stack spacing="md">
					<TextInput
						label="Month Name"
						placeholder="e.g., September 2025"
						value={month}
						onChange={(event) => setMonth(event.currentTarget.value)}
						required
					/>
					<Group position="right" mt="md">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleCreate}>Create</Button>
					</Group>
				</Stack>
			</Modal>
		</MantineProvider>
	);
};

export default function ExpComponent(props: {
	total: number;
	init: Expenditure[];
}) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [info, setInfo] = React.useState<{
		total: number;
		page: number;
		months: Expenditure[];
		loading: boolean;
	}>({
		total: props.total,
		page: 1,
		months: props.init,
		loading: false,
	});

	const handleCreateMonth = async (month: string) => {
		const id = await createMonth(month, "{}");
		close();
		router.push(`/exp/${id}`);
	};

	return (
		<>
			<NewMonthModal
				opened={opened}
				onClose={close}
				onCreate={handleCreateMonth}
			/>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold lg:text-3xl text-white">
					Book of <span className="text-red-600">Expenditure</span> (
					{info.months.length}/{info.total})
				</h1>

				<div
					className="cursor-pointer"
					onClick={open}
					onKeyDown={(e) => {
						if (e.key === "Enter") open();
					}}
					role="button"
					tabIndex={0}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-8 text-red-600 rounded-full hover:text-blue-400 transition-all"
					>
						<title>Add Month Icon</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
				</div>
			</div>

			<hr className="mt-3 mb-8 border-gray-700" />

			<div className="grid md:grid-cols-2 gap-4">
				{info.months.map((month) => (
					<Link
						key={month.id}
						href={`/exp/${month.id}`}
						className="w-full p-8 rounded-lg shadow-md border-2 border-secondary hover:border-blue-700 transition-all transform-border overflow-hidden"
					>
						<div className="flex items-center justify-between">
							<span className="text-sm font-light text-gray-200">
								{month.timestamp?.toLocaleDateString()}
							</span>
						</div>

						<div className="mt-2">
							<span className="text-xl font-bold text-white underline">
								{month.month}
							</span>
						</div>
					</Link>
				))}
			</div>

			{info.total !== info.months.length && (
				<div className="flex justify-end">
					<button
						className={`px-6 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform rounded-lg bg-red-600 hover:bg-red-500 focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-80 justify-center ${info.loading ? "cursor-not-allowed" : "cursor-pointer"
							}`}
						disabled={info.loading}
						type="button"
						onClick={async (e) => {
							e.preventDefault();
							setInfo({
								...info,
								loading: true,
							});
							const notes = await getMonths(++info.page);
							setInfo({
								...info,
								months: [...info.months, ...JSON.parse(notes)],
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
