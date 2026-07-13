"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const env_1 = require("./env");
const index_1 = require("../modules/socket/index");
let io;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: env_1.env.CLIENT_URL,
            credentials: true,
        },
    });
    (0, index_1.registerSocketHandlers)(io);
    return io;
}
function getIO() {
    if (!io)
        throw new Error('Socket.io not initialized yet');
    return io;
}
