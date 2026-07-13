"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIceServers = getIceServers;
const env_1 = require("./env");
function getIceServers() {
    const servers = [{ urls: env_1.env.STUN_URLS.split(',').map((u) => u.trim()) }];
    if (env_1.env.TURN_URL) {
        servers.push({
            urls: env_1.env.TURN_URL,
            username: env_1.env.TURN_USERNAME,
            credential: env_1.env.TURN_CREDENTIAL,
        });
    }
    return servers;
}
