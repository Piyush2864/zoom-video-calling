"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return next(apiError_1.ApiError.badRequest('Validation failed', error.flatten().fieldErrors));
            }
            next(error);
        }
    };
}
