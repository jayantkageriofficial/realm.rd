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

import mongoose from "mongoose";
import { error, event, ready } from "next/dist/build/output/log";
import Config from "@/lib/constant";
import { MiscSchema } from "@/lib/database/schema";

const start = Date.now();

declare global {
	var mongoose: {
		conn: mongoose.Connection | null;
		promise: Promise<mongoose.Connection> | null;
	};
}

if (!global.mongoose) global.mongoose = { conn: null, promise: null };

async function dbConnect(): Promise<mongoose.Connection> {
	if (global.mongoose.conn) return global.mongoose.conn;

	if (!global.mongoose.promise) {
		try {
			const tempConnection = await mongoose.connect(Config.MONGODB_URI, {
				serverSelectionTimeoutMS: 5000,
				connectTimeoutMS: 5000,
				socketTimeoutMS: 5000,
				bufferCommands: false,
			});

			const blockStatus = await MiscSchema.findOne({ blocked: true })
				.maxTimeMS(3000)
				.exec();

			if (blockStatus) {
				await mongoose.disconnect();
				error("Database connections are blocked");
				throw new Error("Database connections are blocked");
			}

			global.mongoose.promise = Promise.resolve(tempConnection.connection);
		} catch (e) {
			await mongoose.disconnect();
			global.mongoose.promise = null;
			error("Mongoose connection error or block detected:", e);
			throw e;
		}
	}

	try {
		global.mongoose.conn = await global.mongoose.promise;
	} catch (e) {
		global.mongoose.promise = null;
		error("Mongoose connection error:", e);
		throw e;
	}

	return global.mongoose.conn;
}

async function closeAllConnections(): Promise<boolean> {
	try {
		if (global.mongoose.conn) {
			await global.mongoose.conn.close(true);
			global.mongoose.conn = null;
			global.mongoose.promise = null;
		}

		await mongoose.disconnect();

		mongoose.connections.forEach((conn) => {
			interface MongooseConnectionWithState extends mongoose.Connection {
				readyState: number;
				emit(
					event: "close" | "connected" | "disconnected" | "error",
					...args: unknown[]
				): boolean;
			}

			const typedConn = conn as MongooseConnectionWithState;
			if (typedConn.readyState !== 0) {
				typedConn.readyState = 0;
				typedConn.emit("close");
			}
		});

		ready("All MongoDB connections forcefully closed");
		return true;
	} catch (e) {
		error("Error closing MongoDB connections:", e);
		return false;
	}
}

function isConnected(): boolean {
	if (global.mongoose.conn?.readyState === 1) return true;
	for (const conn of mongoose.connections) {
		if (conn.readyState === 1) return true;
	}

	return false;
}

dbConnect()
	.then(() => event(`Connected to MongoDB in ${Date.now() - start}ms`))
	.catch((err) => error("MongoDB connection error:", err));

["SIGTERM", "SIGINT"].forEach((signal) => {
	process.on(signal as NodeJS.Signals, async () => {
		if (global.mongoose.conn) {
			await closeAllConnections();
			ready("MongoDB disconnected on app termination");
		}
	});
});

export default dbConnect;
export { closeAllConnections, isConnected };
