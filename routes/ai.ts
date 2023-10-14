// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { auditModel } from "./db/audit-model";
import auditCreator from "./db/audit-creator";
import { AuthenticateManageToken } from "./helper";
// import { idSchema } from "./schemas";
import TextLoader from "../ai/textloader";
import AudioLoader from "../ai/audioloader";

const router = Router();

router.get(
  "/v1/aiadviser/ai-text",
  nocache(),
  AuthenticateManageToken(),
  async (req: Request, res: Response) => {
    const audio = !!req.query.audio || false;

    const question = req.query.question
      ? String(req.query.question)
      : "where is Gary From";

    const filePath = req.query.fileToUse
      ? String(req.query.fileToUse)
      : "ai/example.txt";

    const result = audio
      ? await AudioLoader(question, filePath, audio)
      : await TextLoader(question, filePath, audio);

    res.status(200).json({
      question,
      answer: result,
    });
  }
);

export default router;
