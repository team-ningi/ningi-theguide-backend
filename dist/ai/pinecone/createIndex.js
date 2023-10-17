"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (client, indexName, vectorDimension) => {
    const existingIndexes = (await client.listIndexes()) || [];
    const existing = existingIndexes?.find((item) => {
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
    }
    else {
        console.log(`"${indexName}" already exists.`);
    }
};
