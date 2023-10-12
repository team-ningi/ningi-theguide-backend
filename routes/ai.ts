// @ts-nocheck
import { Request, Response, Router } from "express";
import nocache from "nocache";
import { documentModel } from "./db/document-model";
import documentCreator from "./db/document-creator";
import { AuthenticateManageToken } from "./helper";
// import { idSchema } from "./schemas";
import TextLoader from "../ai/textloader";

const router = Router();

router.get(
  "/v1/aiadviser/ai-text",
  nocache(),
  AuthenticateManageToken(),
  async (req: Request, res: Response) => {
    const question = req.query.question
      ? String(req.query.question)
      : "where is Gary From";

    const filePath = req.query.fileToUse
      ? String(req.query.fileToUse)
      : "ai/example.txt";

    const result = await TextLoader(question, filePath);

    res.status(200).json({
      question,
      answer: result,
    });
  }
);

export default router;
