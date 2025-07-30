// src/lib/redis.ts
import { createClient, RedisClientType } from "redis";
import { captureException } from "@sentry/nextjs"; // Import Sentry

const REDIS_URL = process.env.REDIS_URL;

let redisClient: RedisClientType | undefined;
let connectionPromise: Promise<void> | undefined; // To track the ongoing connection attempt

async function initializeRedisClient(): Promise<void> {
    // If a client already exists and is ready, no need to re-initialize
    if (redisClient && redisClient.isReady) {
        return;
    }

    // If REDIS_URL is not set, we cannot initialize Redis
    if (!REDIS_URL) {
        console.error(
            "REDIS_URL environment variable is not set. Redis caching will be disabled.",
        );
        redisClient = undefined; // Ensure client is explicitly undefined
        return;
    }

    // If a connection attempt is already in progress, wait for it to complete
    if (connectionPromise) {
        return connectionPromise;
    }

    // Start a new connection attempt and store its promise
    connectionPromise = (async () => {
        try {
            const url = new URL(REDIS_URL);
            const host = url.hostname;
            const port = parseInt(url.port || "6379", 10);
            const password = url.password;
            const username = url.username || "default";

            redisClient = createClient({
                socket: {
                    host: host,
                    port: port,
                    tls: true, // Explicitly enable TLS
                    // WARNING: rejectUnauthorized: false should be used with extreme caution in production.
                    // It disables certificate validation and makes your connection vulnerable to MITM attacks.
                    // Only use for diagnostic purposes or if you fully understand the security implications.
                    rejectUnauthorized: false,
                },
                username: username,
                password: password,
            }) as RedisClientType;

            redisClient.on("error", (err) => {
                console.error("Redis Client Error:", err);
                captureException(err, {
                    level: "error",
                    tags: { source: "redis_client_error" },
                });
            });
            redisClient.on("connect", () => {
                console.log("Redis Client Connected!");
            });
            redisClient.on("reconnecting", () => {
                console.log("Redis Client Reconnecting...");
            });
            redisClient.on("end", () => {
                console.log("Redis Client Connection Ended.");
            });

            // Attempt to connect
            await redisClient.connect();
            console.log("Connected to Redis");
        } catch (error) {
            console.error("Failed to initialize or connect to Redis:", error);
            captureException(error, {
                level: "error",
                tags: { source: "redis_connection_failure" },
                extra: { redisUrl: REDIS_URL },
            });
            redisClient = undefined; // Clear client if connection fails
            throw error; // Re-throw to propagate the error to callers of connectionPromise
        } finally {
            connectionPromise = undefined; // Clear the promise once the attempt is done (success or failure)
        }
    })();

    return connectionPromise; // Return the promise of the connection attempt
}

// Call initialize on module load, but don't await it here.
// The `getRedisClient` function will handle awaiting the connection when it's needed.
initializeRedisClient().catch((err) =>
    console.error("Initial Redis connection attempt failed (async init):", err)
);

// Export an async function to get the Redis client.
// This function ensures the client is connected before returning it.
export async function getRedisClient(): Promise<RedisClientType | undefined> {
    // If client is not ready, await the initialization/connection process
    if (!redisClient || !redisClient.isReady) {
        console.warn(
            "Redis client is not ready. Attempting to establish connection...",
        );
        try {
            await initializeRedisClient(); // This will either wait for ongoing connection or start a new one
        } catch (error) {
            console.error("Failed to get connected Redis client:", error);
            captureException(error, {
                level: "error",
                tags: { source: "get_redis_client_failed_reconnect" },
            });
            return undefined; // Return undefined if connection ultimately fails
        }
    }
    return redisClient;
}
