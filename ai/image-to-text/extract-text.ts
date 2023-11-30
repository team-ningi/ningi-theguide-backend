import "dotenv/config";

const {
  TextractClient,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
} = require("@aws-sdk/client-textract");

const dotenv = require("dotenv");
dotenv.config();

const textract = new TextractClient({
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.NEXT_PUBLIC_AWS_KEY_REGION,
});

//step 1
export default async (saved_filename: string, additionalContext: string) => {
  const params = {
    DocumentLocation: {
      S3Object: {
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET,
        Name: saved_filename,
      },
    },
    FeatureTypes: ["TABLES", "FORMS"],
    ClientRequestToken: `${Date.now()}`,
  };

  const startCommand = new StartDocumentAnalysisCommand(params);

  const getDocumentAnalysis = async (jobId: string) => {
    const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId });
    let words = [`${additionalContext} .`];

    while (true) {
      try {
        const data = await textract.send(getCommand);

        console.log("status:", data.JobStatus);

        if (data.JobStatus === "SUCCEEDED") {
          data.Blocks.forEach((block: any) => {
            if (block.BlockType === "WORD") {
              words.push(block.Text);
            }
          });

          if (data.NextToken) {
            // If there is a NextToken, call GetDocumentTextDetectionCommand again with the NextToken
            getCommand.NextToken = data.NextToken;
          } else {
            break; // Exit the loop when all pages have been processed
          }
        } else if (data.JobStatus === "FAILED") {
          console.log("Text extraction failed");
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Check job status every x seconds
      } catch (error) {
        console.error(error);
        break;
      }
    }

    const theResult = words.join(" ");
    console.log("the result ", theResult);

    return theResult;
  };

  return await textract
    .send(startCommand)
    .then(async (data: any) => {
      return await getDocumentAnalysis(data.JobId);
    })
    .catch((error: any) => {
      console.error("failed to extract text", error);
      return false;
    });
};
