"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionOptions = void 0;
const env = {
    REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
};
function parseRedisUrl(url) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        password: parsed.password || undefined,
        username: parsed.username || undefined,
    };
}
exports.redisConnectionOptions = parseRedisUrl(env.REDIS_URL);
//# sourceMappingURL=worker.js.map