import { NextFunction, Request, Response } from "express";
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
    if (process.env.TEST_FLAG_ON) {
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
