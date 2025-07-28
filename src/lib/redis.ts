// src/lib/redis.ts
import { createClient } from "redis";

// Ensure Redis connection details are loaded from environment variables
// For local development, you might use a .env.local file
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
    url: REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis only once
async function connectRedis() {
    if (!redisClient.isReady) {
        try {
            await redisClient.connect();
            console.log("Connected to Redis");
        } catch (error) {
            console.error("Failed to connect to Redis:", error);
            // In a production environment, you might want to throw the error
            // or implement a more robust retry mechanism.
            // For now, we'll just log and let the application continue without cache.
            // process.exit(1); // Only uncomment if you want to halt the app on Redis connection failure
        }
    }
}

// Call connectRedis immediately to ensure connection on server start
connectRedis();

export default redisClient;
