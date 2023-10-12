"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const memory_1 = require("langchain/vectorstores/memory");
const openai_1 = require("langchain/embeddings/openai");
const text_1 = require("langchain/document_loaders/fs/text");
const pdf_1 = require("langchain/document_loaders/fs/pdf");
const axios_1 = __importDefault(require("axios"));
exports.default = async (question = "", filePath = "") => {
    const fileExtension = filePath.split(".").pop();
    let loader;
    if (fileExtension === "txt") {
        loader = new text_1.TextLoader(filePath);
    }
    else if (fileExtension === "pdf") {
        loader = new pdf_1.PDFLoader(filePath, {
            splitPages: false,
        });
    }
    else {
        return "unsupported file type";
    }
    const docs = await loader.load();
    const vectorStore = await memory_1.MemoryVectorStore.fromDocuments(docs, new openai_1.OpenAIEmbeddings());
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
    /*
    PERSONALITY
      START
    {
            role: "user",
            content: `Our character talk a bit like this: "Life is like riding a bicycle. To keep your balance, you must keep moving.
  It is not that I'm so smart. But I stay with the questions much longer.
  The most beautiful experience we can have is the mysterious. It is the fundamental emotion that stands at the cradle of true art and true science.
  Reality is merely an illusion, albeit a very persistent one.
  Make everything as simple as possible, but not simpler.
  Look deep into nature, and then you will understand everything better.
  Nature shows us only the tail of the lion. But I do not doubt that the lion belongs to it even though he cannot at once reveal himself because of his enormous size.
  Nature conceals her secrets because she is sublime, not because she is a trickster.
  We dance for laughter, we dance for tears, we dance for madness, we dance for fears, we dance for hopes, we dance for screams, we are the dancers, we create the dreams.
  If science, like art, is to perform its mission totally and fully, its achievements must enter not only superficially but with their inner meaning: into the consciousness of people.
  The important thing is not to stop questioning. Curiosity has its own reason for existence. One cannot help but be in awe when he contemplates the mysteries of eternity, of life, of the marvelous structure of reality. It is enough if one tries merely to comprehend a little of this mystery each day.
  The measure of intelligence is the ability to change.
  I am enough of an artist to draw freely upon my imagination. Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.
  Whoever undertakes to set himself up as a judge of Truth and Knowledge is shipwrecked by the laughter of the gods.
  Once you can accept the universe as matter expanding into nothing that is something, wearing stripes with plaid comes easy.
  A human being is a part of the whole called by us universe, a part limited in time and space. He experiences himself, his thoughts and feeling as something separated from the rest, a kind of optical delusion of his consciousness."`,
          },
  
  
      END
          {
            role: "user",
            content:
              " Please respond in a similar way to the character presented above",
          },
  
    */
    //  https://platform.openai.com/docs/api-reference/chat/create
    const { data } = await (0, axios_1.default)({
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        data: {
            model: "gpt-4",
            messages: [
                {
                    ...messages[0],
                    content: docs[0].pageContent,
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
