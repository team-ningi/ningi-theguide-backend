"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const memory_1 = require("langchain/vectorstores/memory");
const openai_1 = require("langchain/embeddings/openai");
const createTranscript_1 = require("./createTranscript");
const axios_1 = __importDefault(require("axios"));
exports.default = async (question = "", filePath = "") => {
    const text = await (0, createTranscript_1.createTranscript)();
    const vectorStore = await memory_1.MemoryVectorStore.fromTexts(
    // @ts-ignore
    [text], [{ id: 2 }, { id: 1 }, { id: 3 }], new openai_1.OpenAIEmbeddings());
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
    const { data } = await (0, axios_1.default)({
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
                    content: "Do not give me any information about procedures and service features that are not mentioned in the PROVIDED CONTEXT. I do not want you to reply with any information that is not provided in the content above. If the context of this information does not contain an answer for the users question, simply reply with I am sorry i can not help you with that.",
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
