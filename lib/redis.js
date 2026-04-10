import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

const redisClient = redisUrl
  ? createClient({
      url: redisUrl,
    })
  : null;

if (redisClient) {
  redisClient.on("error", (err) => {
    console.error("Redis Error:", err.message);
  });

  redisClient.on("end", () => {
    isConnected = false;
  });
}

let isConnected = false;

export async function connectRedis() {
  if (!redisClient || !redisUrl) return false;
  if (isConnected) return true;

  try {
    await redisClient.connect();
    isConnected = true;
    return true;
  } catch (error) {
    console.error("Redis Connection Failed:", error.message);
    isConnected = false;
    return false;
  }
}

export async function getJsonCache(key) {
  try {
    const connected = await connectRedis();
    if (!connected) return null;

    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Redis GET Error [${key}]:`, error.message);
    isConnected = false;
    return null;
  }
}

export async function setJsonCache(key, value, ttlSeconds = 600) {
  try {
    const connected = await connectRedis();
    if (!connected) return false;

    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Redis SET Error [${key}]:`, error.message);
    isConnected = false;
    return false;
  }
}

export async function deleteCacheKeys(keys = []) {
  try {
    if (!keys.length) return false;

    const connected = await connectRedis();
    if (!connected) return false;

    const uniqueKeys = [...new Set(keys.filter(Boolean))];
    if (!uniqueKeys.length) return false;

    await redisClient.del(uniqueKeys);
    return true;
  } catch (error) {
    console.error("Redis DELETE Error:", error.message);
    isConnected = false;
    return false;
  }
}

export default redisClient;
