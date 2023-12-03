import "dotenv/config";
import { OpenAI } from "langchain/llms/openai";
import { Document } from "langchain/document";
import { loadQAStuffChain } from "langchain/chains";

const dotenv = require("dotenv");
dotenv.config();

const issueTextArray = [
  "I'm sorry",
  "Im sorry",
  "provided text is fragmented",
  "I dont know",
  "I don't know",
  "unclear and scattered",
  "impossible to decipher",
  "lack necessary context",
  "lacks clarity",
];

let errors = 0;
let attempts = 0;
let maxTries = 10;

//step 2
export default async (originalText: string) => {
  try {
    const llm = new OpenAI({ modelName: "gpt-4" });
    const chain = loadQAStuffChain(llm);

    const refinedResult = await chain.call({
      input_documents: [new Document({ pageContent: originalText })],
      question: `Can you rewrite the provided text as clearly as possible. do not make any information up, only use the context provided.Can any currency or data referencing money be referred to in GBP £, Can all dates be formatted to be presented as 'DD/MM/YYYY', Can the text be returned with line breaks for it to be easier to read back.`,
    });

    console.log("refinedResult:", refinedResult?.text);
    let refinedText = refinedResult?.text;

    issueTextArray.forEach((text) => {
      if (refinedText.includes(text)) {
        errors++;
      }
    });

    while (errors > 0 && attempts < maxTries) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const refinedResult = await chain.call({
        input_documents: [new Document({ pageContent: originalText })],
        question: `Can you rewrite the provided text as clearly as possible. do not make any information up, only use the context provided.Can any currency or data referencing money be referred to in GBP £, Can all dates be formatted to be presented as 'DD/MM/YYYY', Can the text be returned with line breaks for it to be easier to read back.`,
      });

      console.log(`refine attempt ${attempts}:  ${refinedResult?.text}`);

      refinedText = refinedResult?.text;
      attempts++;
      errors = 0;
      issueTextArray.forEach((text) => {
        if (refinedText.includes(text)) {
          errors++;
        }
      });

      if (errors < 1) {
        break;
      }
    }

    return {
      originalText,
      refined: refinedText,
    };
  } catch (error: any) {
    console.error("failed to refine text", error);
    return false;
  }
};
