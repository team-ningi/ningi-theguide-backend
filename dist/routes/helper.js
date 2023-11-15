"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = exports.addToAudit = exports.AuthenticateManageToken = exports.authTokenVerification = exports.getPresignedUrl = void 0;
const crypto = __importStar(require("crypto")); //@ts-ignore
const audit_creator_1 = __importDefault(require("./db/audit-creator"));
const axios_1 = __importDefault(require("axios"));
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config();
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.NEXT_PUBLIC_AWS_KEY_REGION,
});
const getPresignedUrl = async (filePath) => getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET,
    Key: filePath,
}), { expiresIn: 60 });
exports.getPresignedUrl = getPresignedUrl;
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
        console.log("Valid Session");
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
const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = Buffer.from(`${process.env.ENCRYPTION_KEY}`, "base64");
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
    const encrypted = cipher.update(text, "utf8", "hex");
    return [
        encrypted + cipher.final("hex"),
        Buffer.from(iv).toString("hex"),
    ].join("|");
}
exports.encrypt = encrypt;
function decrypt(text) {
    if (text) {
        // console.log("decrypt >", text);
        const [encrypted, iv] = text.split("|");
        if (!iv)
            return console.log("IV not found");
        const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, Buffer.from(iv, "hex"));
        return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    }
}
exports.decrypt = decrypt;
