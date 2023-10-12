"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateManageToken = exports.authTokenVerification = void 0;
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
    // const authToken = req.get("engageSession");
    // const { valid } = await authTokenVerification(authToken);
    // if (valid) {
    //   return next();
    // } else {
    //   return res.send({
    //     status: 403,
    //     msg: "you are not allowed to perform this action",
    //   });
    // }
    return next();
};
exports.AuthenticateManageToken = AuthenticateManageToken;
