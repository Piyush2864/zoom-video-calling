"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const user_model_1 = require("./user.model");
class UserRepository {
    findById(id) {
        return user_model_1.User.findById(id).exec();
    }
    findByIdWithPassword(id) {
        return user_model_1.User.findById(id).select('+password').exec();
    }
    findPublicById(id) {
        return user_model_1.User.findById(id).select('name avatar').exec();
    }
    updateName(id, name) {
        return user_model_1.User.findByIdAndUpdate(id, { name }, { new: true }).exec();
    }
    updateAvatar(id, avatarUrl, avatarPublicId) {
        return user_model_1.User.findByIdAndUpdate(id, { avatar: avatarUrl, avatarPublicId }, { new: true }).exec();
    }
    removeAvatar(id) {
        return user_model_1.User.findByIdAndUpdate(id, { $unset: { avatar: '', avatarPublicId: '' } }, { new: true }).exec();
    }
    updateSettings(id, settings) {
        const update = {};
        for (const [key, value] of Object.entries(settings)) {
            if (value !== undefined)
                update[`settings.${key}`] = value;
        }
        return user_model_1.User.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
    }
    updatePassword(id, hashedPassword) {
        return user_model_1.User.findByIdAndUpdate(id, { password: hashedPassword }).exec();
    }
    incrementTokenVersion(id) {
        return user_model_1.User.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }).exec();
    }
    deleteById(id) {
        return user_model_1.User.findByIdAndDelete(id).exec();
    }
}
exports.UserRepository = UserRepository;
