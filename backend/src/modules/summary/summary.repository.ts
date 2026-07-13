import { AISummary, IAISummary } from './summary.model';

export class SummaryRepository {
  findByMeeting(meetingId: string) {
    return AISummary.findOne({ meeting: meetingId }).exec();
  }

  upsert(meetingId: string, data: Partial<IAISummary>) {
    return AISummary.findOneAndUpdate(
      { meeting: meetingId },
      { ...data, meeting: meetingId },
      { new: true, upsert: true }
    ).exec();
  }

  deleteByMeeting(meetingId: string) {
    return AISummary.findOneAndDelete({ meeting: meetingId }).exec();
  }
}
