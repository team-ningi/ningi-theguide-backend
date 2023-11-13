import { NextFunction, Request, Response } from "express";
import * as crypto from "crypto"; //@ts-ignore
import auditCreator from "./db/audit-creator";
import axios from "axios";
const dotenv = require("dotenv");
dotenv.config();

export const authTokenVerification = async (token: string) => {
  try {
    const {
      data: { session_id: sessionID },
    } = await axios({
      method: "get",
      url: `${process.env.MANAGE_API_URL}/v1/tokens`,
      params: { token, journey: "" },
      headers: {
        Authorization: process.env.MANAGE_APPLICATION_TOKEN,
      },
      maxRedirects: 0,
    });

    return { valid: true, sessionID };
  } catch (error: any) {
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

export const AuthenticateManageToken =
  () => async (req: Request, res: Response, next: NextFunction) => {
    const APPLICATION_TOKEN = req.get("Authorization") || "";

    if (
      process.env.TEST_FLAG_ON ||
      APPLICATION_TOKEN === process.env.TEST_APPLICATION_TOKEN
    ) {
      return next();
    }

    const authToken = req.get("engageSession") || "";
    const { valid } = await authTokenVerification(authToken);

    if (valid) {
      return next();
    } else {
      return res.send({
        status: 403,
        msg: "you are not allowed to perform this action",
      });
    }
  };

export const addToAudit = async (
  req: Request,
  auditData: {
    user_id: string;
    path: string;
    action: string;
    metadata: object;
  }
) => {
  try {
    const applicationToken = req.get("Authorization") || "";
    const authToken = req.get("engageSession") || "";
    const { user_id, path, action } = auditData;
    const metadata = { ...auditData?.metadata, authToken, applicationToken };

    auditCreator({ user_id, path, action, metadata });
  } catch (e) {
    // swallow
  }
};

const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = Buffer.from(`${process.env.ENCRYPTION_KEY}`, "base64");

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
  const encrypted = cipher.update(text, "utf8", "hex");
  return [
    encrypted + cipher.final("hex"),
    Buffer.from(iv).toString("hex"),
  ].join("|");
}

export function decrypt(text: string) {
  if (text) {
    // console.log("decrypt >", text);
    const [encrypted, iv] = text.split("|");
    if (!iv) return console.log("IV not found");
    const decipher = crypto.createDecipheriv(
      algorithm,
      ENCRYPTION_KEY,
      Buffer.from(iv, "hex")
    );
    return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
  }
}
