"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const webrtc_controller_1 = require("./webrtc.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/ice-servers', webrtc_controller_1.getIceServersConfig);
exports.default = router;
