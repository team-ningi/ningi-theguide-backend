import "dotenv/config";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import { createTranscript } from "./createTranscript";

import axios from "axios";

export default async (question = "", filePath = "") => {
  const text = await createTranscript();

  const vectorStore = await MemoryVectorStore.fromTexts(
    // @ts-ignore
    [text],
    [{ id: 2 }, { id: 1 }, { id: 3 }],
    new OpenAIEmbeddings()
  );

  // @ts-ignore
  const searchResponse = await vectorStore.similaritySearch(question, 1);

  const messages = [];
  messages.push({
    role: "user",
    content: searchResponse?.length // @ts-ignore
      ? searchResponse.map((item) => item?.text).join("\n")
      : "No context found in documents.",
  });
  messages.push({
    role: "user",
    content: question,
  });

  //  https://platform.openai.com/docs/api-reference/chat/create
  const { data } = await axios({
    url: "https://api.openai.com/v1/chat/completions",
    method: "POST",
    data: {
      model: "gpt-4",
      messages: [
        {
          ...messages[0],
          content: text,
        },
        messages[1],
        {
          role: "system",
          content:
            "Do not give me any information about procedures and service features that are not mentioned in the PROVIDED CONTEXT. I do not want you to reply with any information that is not provided in the content above. If the context of this information does not contain an answer for the users question, simply reply with I am sorry i can not help you with that.",
        },
      ],
    },
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  // console.log("answer ", data.choices[0].message.content);
  console.log(data.error);
  return data.choices[0].message.content;
};
