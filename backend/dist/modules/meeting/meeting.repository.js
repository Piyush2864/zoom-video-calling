"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingRepository = void 0;
const meeting_model_1 = require("./meeting.model");
const constants_1 = require("../../config/constants");
class MeetingRepository {
    create(data) {
        return meeting_model_1.Meeting.create(data);
    }
    findById(id) {
        return meeting_model_1.Meeting.findById(id).populate('host', 'name avatar').exec();
    }
    findByIdWithPassword(id) {
        return meeting_model_1.Meeting.findById(id).select('+passwordHash').populate('host', 'name avatar').exec();
    }
    findByMeetingCode(meetingCode) {
        return meeting_model_1.Meeting.findOne({ meetingCode }).select('+passwordHash').populate('host', 'name avatar').exec();
    }
    findPersonalRoomByHost(hostId) {
        return meeting_model_1.Meeting.findOne({ host: hostId, isPersonalRoom: true }).exec();
    }
    save(meeting) {
        return meeting.save();
    }
    findUpcomingForUser(userId) {
        return meeting_model_1.Meeting.find({
            $or: [{ host: userId }, { 'participants.user': userId }],
            status: { $in: [constants_1.MeetingStatus.SCHEDULED, constants_1.MeetingStatus.ONGOING] },
        })
            .sort({ scheduledStartTime: 1 })
            .populate('host', 'name avatar')
            .exec();
    }
    findHistoryForUser(userId) {
        return meeting_model_1.Meeting.find({
            $or: [{ host: userId }, { 'participants.user': userId }],
            status: { $in: [constants_1.MeetingStatus.ENDED, constants_1.MeetingStatus.CANCELLED] },
        })
            .sort({ actualEndTime: -1, updatedAt: -1 })
            .populate('host', 'name avatar')
            .exec();
    }
    deleteById(id) {
        return meeting_model_1.Meeting.findByIdAndDelete(id).exec();
    }
}
exports.MeetingRepository = MeetingRepository;
