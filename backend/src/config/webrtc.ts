import { env } from './env';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function getIceServers(): IceServer[] {
  const servers: IceServer[] = [{ urls: env.STUN_URLS.split(',').map((u) => u.trim()) }];

  if (env.TURN_URL) {
    servers.push({
      urls: env.TURN_URL,
      username: env.TURN_USERNAME,
      credential: env.TURN_CREDENTIAL,
    });
  }

  return servers;
}
