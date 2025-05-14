import mongoose from "mongoose";
import Config from "@/lib/constant";
import { info, error, event } from "next/dist/build/output/log";

const start = new Date().getTime();

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

if (!global.mongoose) global.mongoose = { conn: null, promise: null };

async function dbConnect(): Promise<mongoose.Connection> {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise)
    global.mongoose.promise = mongoose
      .connect(Config.MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m.connection);

  try {
    global.mongoose.conn = await global.mongoose.promise;
  } catch (e) {
    global.mongoose.promise = null;
    error("Mongoose connection error:", e);
    throw e;
  }

  return global.mongoose.conn;
}

dbConnect()
  .then(() =>
    event(`Connected to MongoDB in ${new Date().getTime() - start}ms`)
  )
  .catch((err) => error("MongoDB connection error:", err));

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal as NodeJS.Signals, async () => {
    if (global.mongoose.conn) {
      await mongoose.disconnect();
      info("MongoDB disconnected on app termination");
      process.exit(0);
    }
  });
});

export default dbConnect;
