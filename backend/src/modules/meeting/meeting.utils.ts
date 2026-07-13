import { Types } from 'mongoose';


export function idToString(value: Types.ObjectId | { _id: Types.ObjectId } | string): string {
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  return value._id.toString();
}
