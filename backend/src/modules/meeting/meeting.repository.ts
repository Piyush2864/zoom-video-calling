import { Meeting } from './meeting.model';
import { MeetingStatus } from '../../config/constants';

export class MeetingRepository {
  create(data: Partial<import('./meeting.model').IMeeting>) {
    return Meeting.create(data);
  }

  findById(id: string) {
    return Meeting.findById(id).populate('host', 'name avatar').exec();
  }

  findByIdWithPassword(id: string) {
    return Meeting.findById(id).select('+passwordHash').populate('host', 'name avatar').exec();
  }

  findByMeetingCode(meetingCode: string) {
    return Meeting.findOne({ meetingCode }).select('+passwordHash').populate('host', 'name avatar').exec();
  }

  findPersonalRoomByHost(hostId: string) {
    return Meeting.findOne({ host: hostId, isPersonalRoom: true }).exec();
  }

  save(meeting: import('./meeting.model').IMeeting) {
    return meeting.save();
  }

  findUpcomingForUser(userId: string) {
    return Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
      status: { $in: [MeetingStatus.SCHEDULED, MeetingStatus.ONGOING] },
    })
      .sort({ scheduledStartTime: 1 })
      .populate('host', 'name avatar')
      .exec();
  }

  findHistoryForUser(userId: string) {
    return Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
      status: { $in: [MeetingStatus.ENDED, MeetingStatus.CANCELLED] },
    })
      .sort({ actualEndTime: -1, updatedAt: -1 })
      .populate('host', 'name avatar')
      .exec();
  }

  deleteById(id: string) {
    return Meeting.findByIdAndDelete(id).exec();
  }
}
