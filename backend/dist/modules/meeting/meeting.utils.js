"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idToString = idToString;
exports.isHostOrCoHost = isHostOrCoHost;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
function idToString(value) {
    if (typeof value === 'string')
        return value;
    if (value instanceof mongoose_1.Types.ObjectId)
        return value.toString();
    return value._id.toString();
}
function isHostOrCoHost(meeting, userId) {
    if (idToString(meeting.host) === userId)
        return true;
    const participant = meeting.participants.find((p) => p.user.toString() === userId);
    return participant?.role === constants_1.MeetingRole.CO_HOST;
}
