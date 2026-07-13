"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addParticipant = addParticipant;
exports.removeParticipant = removeParticipant;
exports.getParticipants = getParticipants;
exports.getMeetingsForSocket = getMeetingsForSocket;
exports.getSocketIdsForUser = getSocketIdsForUser;
const roomParticipants = new Map();
const socketMeetings = new Map();
function addParticipant(meetingId, socketId, userId) {
    if (!roomParticipants.has(meetingId))
        roomParticipants.set(meetingId, new Map());
    roomParticipants.get(meetingId).set(socketId, userId);
    if (!socketMeetings.has(socketId))
        socketMeetings.set(socketId, new Set());
    socketMeetings.get(socketId).add(meetingId);
}
function removeParticipant(meetingId, socketId) {
    roomParticipants.get(meetingId)?.delete(socketId);
    if (roomParticipants.get(meetingId)?.size === 0)
        roomParticipants.delete(meetingId);
    socketMeetings.get(socketId)?.delete(meetingId);
    if (socketMeetings.get(socketId)?.size === 0)
        socketMeetings.delete(socketId);
}
function getParticipants(meetingId) {
    const room = roomParticipants.get(meetingId);
    if (!room)
        return [];
    return Array.from(room.entries()).map(([socketId, userId]) => ({ socketId, userId }));
}
function getMeetingsForSocket(socketId) {
    return Array.from(socketMeetings.get(socketId) || []);
}
function getSocketIdsForUser(meetingId, userId) {
    const room = roomParticipants.get(meetingId);
    if (!room)
        return [];
    return Array.from(room.entries())
        .filter(([, uid]) => uid === userId)
        .map(([socketId]) => socketId);
}
