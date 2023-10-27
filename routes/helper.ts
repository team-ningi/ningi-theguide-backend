import { NextFunction, Request, Response } from "express"; //@ts-ignore
import auditCreator from "./db/audit-creator";
import axios from "axios";

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
