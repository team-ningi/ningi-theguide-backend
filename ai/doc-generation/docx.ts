const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const https = require("https");
import { Errback, Response } from "express"; //@ts-ignore
import { reportsModel } from "../../routes/db/reports-model";
import { S3 } from "aws-sdk";
const path = require("path");
const s3 = new S3({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_AWS_KEY_REGION,
});

/* docs : basic.dox  | suitabilityReportTemplate.docx */

export default async (
  tags: any,
  reportId: string,
  templateURL: string,
  outputName: string
) => {
  let content;
  const useLocalFile = false;

  if (useLocalFile) {
    // Load the docx file as binary content
    content = fs.readFileSync(
      path.resolve(__dirname, "suitabilityReportTemplate.docx"),
      "binary"
    );
  }

  if (!useLocalFile) {
    const document_url = templateURL;
    const streamName = `/tmp/${Date.now()}.docx`;

    const file = fs.createWriteStream(streamName);

    content = await new Promise((resolve, reject) => {
      https.get(document_url, (response: Response) => {
        var stream = response.pipe(file);
        stream.on("finish", function () {
          fs.readFile(streamName, "binary", (err: Errback, data: string) => {
            if (err) {
              console.error(err);
              return;
            }
            resolve(data);
          });
        });
      });
    });
  }

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(tags);

  const buf = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  if (useLocalFile) {
    // buf is a nodejs Buffer, you can either write it to a file or res.send it with express for example.
    fs.writeFileSync(path.resolve(__dirname, "output.docx"), buf);
    return buf;
  }

  if (!useLocalFile) {
    try {
      const params = {
        Bucket: `${process.env.NEXT_PUBLIC_AWS_BUCKET}`,
        Key: outputName,
        Body: buf,
      };

      const options = { partSize: 10 * 1024 * 1024, queueSize: 1 };
      const upload = s3.upload(params, options);
      await upload.promise();

      await reportsModel.findOneAndUpdate(
        { _id: reportId },
        {
          generated_report_url: `${process.env.NEXT_PUBLIC_AWS_CDN_URL}/${outputName}`,
          generated_report: true,
        },
        {
          new: true,
          upsert: false,
        }
      );
      return;
    } catch {
      console.log("failed to save file to CDN");
    }
  }
};
