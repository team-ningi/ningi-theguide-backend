import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { Pinecone } from "@pinecone-database/pinecone";

export const queryPineconeVectorStoreAndQueryLLM = async (
  client: Pinecone,
  indexName: string,
  question: string,
  filterQuery: object,
  type: string
) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const index = client.Index(indexName);
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);

  let queryResponse = await index.query({
    topK: 10,
    vector: queryEmbedding,
    filter: filterQuery,
    includeMetadata: true,
    includeValues: true,
  });

  console.log(`Found ${queryResponse.matches.length} matches...`);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ modelName: "gpt-4" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match?.metadata?.pageContent)
      .join(" ");

    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: question,
    });

    console.log(`\n\n Answer: ${result.text}`);
    if (type === "chat") {
      return result.text;
    }

    try {
      return JSON.parse(result.text);
    } catch (error) {
      try {
        console.error("retrying to generate tags, ", error);
        const result = await chain.call({
          input_documents: [
            new Document({ pageContent: concatenatedPageContent }),
          ],
          question: question,
        });
        return JSON.parse(result.text);
      } catch (error) {
        console.error("Error JSON parsing on retry, ", error); // dont return , will break the tagResult object
        throw new Error("Failed to generate tags for report");
      }
    }
  } else {
    return "No results found.";
  }
};
