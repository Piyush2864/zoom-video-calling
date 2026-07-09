import { env } from './env';


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
