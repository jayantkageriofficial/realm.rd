import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

const MONGODB_URI = "mongodb://127.0.0.1:27017/revamp";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}
async function dbConnect(): Promise<mongoose.Connection> {
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: false,
    };

    global.mongoose.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => m.connection);
  }

  try {
    global.mongoose.conn = await global.mongoose.promise;
  } catch (e) {
    global.mongoose.promise = null;
    console.error("Mongoose connection error:", e);
    throw e;
  }

  return global.mongoose.conn;
}

dbConnect()
  .then(() => console.info("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal as NodeJS.Signals, async () => {
    if (global.mongoose.conn) {
      await mongoose.disconnect();
      console.info("MongoDB disconnected on app termination");
      process.exit(0);
    }
  });
});

export default dbConnect;
