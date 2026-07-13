"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryRepository = void 0;
const summary_model_1 = require("./summary.model");
class SummaryRepository {
    findByMeeting(meetingId) {
        return summary_model_1.AISummary.findOne({ meeting: meetingId }).exec();
    }
    upsert(meetingId, data) {
        return summary_model_1.AISummary.findOneAndUpdate({ meeting: meetingId }, { ...data, meeting: meetingId }, { new: true, upsert: true }).exec();
    }
    deleteByMeeting(meetingId) {
        return summary_model_1.AISummary.findOneAndDelete({ meeting: meetingId }).exec();
    }
}
exports.SummaryRepository = SummaryRepository;
