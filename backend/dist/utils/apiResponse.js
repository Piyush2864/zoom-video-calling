"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(message, data) {
        this.success = true;
        this.message = message;
        this.data = data;
    }
}
exports.ApiResponse = ApiResponse;
