const env = {
  REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
};

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
  };
}

export const redisConnectionOptions = parseRedisUrl(env.REDIS_URL);
