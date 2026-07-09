"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionOptions = void 0;
const env_1 = require("./env");
function parseRedisUrl(url) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        password: parsed.password || undefined,
        username: parsed.username || undefined,
    };
}
exports.redisConnectionOptions = parseRedisUrl(env_1.env.REDIS_URL);
//# sourceMappingURL=redis.js.map