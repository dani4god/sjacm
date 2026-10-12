import mongoose from "mongoose";
const cache = globalThis as typeof globalThis & {
  mongoPromise?: Promise<typeof mongoose>;
};
export async function db() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing");
  if (!cache.mongoPromise)
    cache.mongoPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        cache.mongoPromise = undefined;
        throw error;
      });
  return cache.mongoPromise;
}
