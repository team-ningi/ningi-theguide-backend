import "dotenv/config";
import { OpenAI } from "langchain/llms/openai";
import { Document } from "langchain/document";
import { loadQAStuffChain } from "langchain/chains";

const dotenv = require("dotenv");
dotenv.config();

//step 2
export default async (originalText: string) => {
  try {
    const llm = new OpenAI({ modelName: "gpt-4" });
    const chain = loadQAStuffChain(llm);

    const refinedResult = await chain.call({
      input_documents: [
        //@ts-ignore
        new Document({ pageContent: originalText }),
      ],
      question: `Can you rewrite the provided text as clearly as possible. do not make any information up, only use the context provided.Can any currency or data referencing money be referred to in GBP £, Can all dates be formatted to be presented as 'DD/MM/YYYY', Can the text be returned with line breaks for it to be easier to read back.`,
    });

    console.log("refinedResult:", refinedResult?.text);
    return {
      originalText,
      refined: refinedResult?.text,
    };
  } catch (error: any) {
    console.error("failed to refine text", error);
    return false;
  }
};
