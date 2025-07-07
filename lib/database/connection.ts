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
import { createClient } from "redis";
import { error, event, ready } from "next/dist/build/output/log";
import Config from "@/lib/constant";
import { MiscSchema } from "@/lib/database/schema";

const start = Date.now();

type RedisClient = ReturnType<typeof createClient>;

declare global {
  var database: {
    mongoose: {
      conn: mongoose.Connection | null;
      promise: Promise<mongoose.Connection> | null;
    };
    redis: {
      client: RedisClient | null;
      promise: Promise<RedisClient> | null;
    };
    initialized: boolean;
  };
}

if (!global.database) {
  global.database = {
    mongoose: { conn: null, promise: null },
    redis: { client: null, promise: null },
    initialized: false,
  };
}

async function mongoConnect(): Promise<mongoose.Connection> {
  if (global.database.mongoose.conn) return global.database.mongoose.conn;

  if (!global.database.mongoose.promise) {
    global.database.mongoose.promise = (async () => {
      try {
        const tempConnection = await mongoose.connect(Config.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 5000,
          bufferCommands: false,
        });

        if (tempConnection.connection.readyState !== 1) {
          await new Promise<void>((resolve, reject) => {
            tempConnection.connection.once("connected", resolve);
            tempConnection.connection.once("error", reject);

            setTimeout(() => reject(new Error("Connection timeout")), 10000);
          });
        }

        const blockStatus = await MiscSchema.findOne({ blocked: true })
          .maxTimeMS(3000)
          .exec();

        if (blockStatus) {
          await mongoose.disconnect();
          error("Database connections are blocked");
          throw new Error("Database connections are blocked");
        }

        return tempConnection.connection;
      } catch (e) {
        await mongoose.disconnect();
        global.database.mongoose.promise = null;
        throw e;
      }
    })();
  }

  try {
    global.database.mongoose.conn = await global.database.mongoose.promise;
  } catch (e) {
    global.database.mongoose.promise = null;
    throw e;
  }

  return global.database.mongoose.conn;
}

async function redisConnect(): Promise<RedisClient> {
  if (global.database.redis.client && global.database.redis.client.isOpen) {
    return global.database.redis.client;
  }

  if (!global.database.redis.promise) {
    global.database.redis.promise = (async () => {
      try {
        const client = createClient({
          url: Config.REDIS_URI,
          socket: {
            connectTimeout: 5000,
          },
        });

        await client.connect();
        return client;
      } catch (e) {
        global.database.redis.promise = null;
        throw e;
      }
    })();
  }

  try {
    global.database.redis.client = await global.database.redis.promise;
  } catch (e) {
    global.database.redis.promise = null;
    throw e;
  }

  return global.database.redis.client;
}

async function dbConnect(): Promise<{
  mongo: mongoose.Connection;
  redis: RedisClient;
}> {
  try {
    const [mongoConn, redisConn] = await Promise.all([
      mongoConnect(),
      redisConnect(),
    ]);

    return {
      mongo: mongoConn,
      redis: redisConn,
    };
  } catch (e) {
    error("Database connection error:", e);
    throw e;
  }
}

async function initializeConnections(): Promise<void> {
  if (global.database.initialized) return;

  try {
    await dbConnect();
    const duration = Date.now() - start;

    event(`MongoDB connected in ${duration}ms`);
    event(`Redis connected in ${duration}ms`);

    global.database.initialized = true;
  } catch (err) {
    error("Database connection error:", err);
    throw err;
  }
}

async function closeAllConnections(): Promise<boolean> {
  let success = true;

  try {
    if (global.database.mongoose.conn) {
      await global.database.mongoose.conn.close(true);
      global.database.mongoose.conn = null;
      global.database.mongoose.promise = null;
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

    ready("All MongoDB connections closed");
  } catch (e) {
    error("Error closing MongoDB connections:", e);
    success = false;
  }

  try {
    if (global.database.redis.client && global.database.redis.client.isOpen) {
      await global.database.redis.client.quit();
      global.database.redis.client = null;
      global.database.redis.promise = null;
    }

    ready("All Redis connections closed");
  } catch (e) {
    error("Error closing Redis connections:", e);
    success = false;
  }

  global.database.initialized = false;
  return success;
}

function isConnected(): {
  mongo: boolean;
  redis: boolean;
  both: boolean;
  initialized: boolean;
} {
  const mongoConnected =
    global.database.mongoose.conn?.readyState === 1 ||
    mongoose.connections.some((conn) => conn.readyState === 1);

  const redisConnected = global.database.redis.client?.isOpen === true;

  return {
    mongo: mongoConnected,
    redis: redisConnected,
    both: mongoConnected && redisConnected,
    initialized: global.database.initialized,
  };
}

async function getMongoConnection(): Promise<mongoose.Connection> {
  if (!global.database.initialized) await initializeConnections();
  return await mongoConnect();
}

async function getRedisConnection(): Promise<RedisClient> {
  if (!global.database.initialized) await initializeConnections();
  return await redisConnect();
}

if (process.env.NEXT_RUNTIME === "nodejs") {
  initializeConnections().catch((err) => {
    error("Failed to initialize database connections:", err);
  });
}

export default dbConnect;
export {
  closeAllConnections,
  isConnected,
  getMongoConnection,
  getRedisConnection,
};
