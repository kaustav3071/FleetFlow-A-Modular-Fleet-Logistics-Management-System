import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redis = null;
let isRedisConnected = false;

try {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
            if (times > 3) {
                console.warn("⚠️  Redis: Max retries reached. Running without Redis.");
                return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true, // Don't connect immediately
    });

    // Attempt connection
    redis.connect().then(() => {
        isRedisConnected = true;
        console.log("✅ Redis connected successfully");
    }).catch((err) => {
        isRedisConnected = false;
        console.warn("⚠️  Redis not available — running without Redis. Token refresh & email queue will use fallbacks.");
    });

    redis.on("error", () => {
        // Suppress repeated error logs
        if (isRedisConnected) {
            isRedisConnected = false;
            console.warn("⚠️  Redis connection lost.");
        }
    });

    redis.on("connect", () => {
        isRedisConnected = true;
    });
} catch (err) {
    console.warn("⚠️  Redis initialization failed — running without Redis.");
}

/**
 * Check if Redis is currently available
 */
export const isRedisAvailable = () => isRedisConnected && redis !== null;

export default redis;
