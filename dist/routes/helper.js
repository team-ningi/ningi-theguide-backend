"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToAudit = exports.AuthenticateManageToken = exports.authTokenVerification = void 0;
const audit_creator_1 = __importDefault(require("./db/audit-creator"));
const axios_1 = __importDefault(require("axios"));
const authTokenVerification = async (token) => {
    try {
        const { data: { session_id: sessionID }, } = await (0, axios_1.default)({
            method: "get",
            url: `${process.env.MANAGE_API_URL}/v1/tokens`,
            params: { token, journey: "" },
            headers: {
                Authorization: process.env.MANAGE_APPLICATION_TOKEN,
            },
            maxRedirects: 0,
        });
        return { valid: true, sessionID };
    }
    catch (error) {
        switch (error.response?.status) {
            case 404:
                // auth token expired
                break;
            default:
                console.log(error);
                break;
        }
        return { valid: false };
    }
};
exports.authTokenVerification = authTokenVerification;
const AuthenticateManageToken = () => async (req, res, next) => {
    const APPLICATION_TOKEN = req.get("Authorization") || "";
    if (process.env.TEST_FLAG_ON ||
        APPLICATION_TOKEN === process.env.TEST_APPLICATION_TOKEN) {
        return next();
    }
    const authToken = req.get("engageSession") || "";
    const { valid } = await (0, exports.authTokenVerification)(authToken);
    if (valid) {
        return next();
    }
    else {
        return res.send({
            status: 403,
            msg: "you are not allowed to perform this action",
        });
    }
};
exports.AuthenticateManageToken = AuthenticateManageToken;
const addToAudit = async (req, auditData) => {
    try {
        const applicationToken = req.get("Authorization") || "";
        const authToken = req.get("engageSession") || "";
        const { user_id, path, action } = auditData;
        const metadata = { ...auditData?.metadata, authToken, applicationToken };
        (0, audit_creator_1.default)({ user_id, path, action, metadata });
    }
    catch (e) {
        // swallow
    }
};
exports.addToAudit = addToAudit;
