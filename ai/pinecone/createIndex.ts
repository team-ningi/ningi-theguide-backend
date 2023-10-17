import { Pinecone } from "@pinecone-database/pinecone";

export default async (
  client: Pinecone,
  indexName: string,
  vectorDimension: number
) => {
  const existingIndexes = (await client.listIndexes()) || [];
  const existing = existingIndexes?.find((item: { name: string }) => {
    console.log("item ", item?.name === indexName);
    return item?.name === indexName;
  });

  if (!existing) {
    await client.createIndex({
      name: indexName,
      dimension: vectorDimension,
      metric: "cosine",
    });
    console.log("Created index");
  } else {
    console.log(`"${indexName}" already exists.`);
  }
};
