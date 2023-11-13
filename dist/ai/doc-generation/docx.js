"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const https = require("https");
const aws_sdk_1 = require("aws-sdk");
const path = require("path");
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_AWS_KEY_REGION,
});
/* docs : basic.dox  | suitabilityReportTemplate.docx */
/*
  TODO
11111111
  PASS :
    REPORT ID
    TEMPLATE URL                > templateToUse
    FILENAME TO SAVE REPORT AS  > reportOutputName

22222222
  UPDATE REPORT DB
    user_id,report_id
  SET
    generated_report_url -> THE S3 URL
    generated_report     -> TRUE

    const result = await reportsModel.findOneAndUpdate(
        { _id: report_id },
        {
          generated_report_url:
            generated_report_url || report[0]?.generated_report_url,
          generated_report: generated_report || report[0]?.generated_report,
        },
        {
          new: true,
          upsert: false,
        }
      );
*/
exports.default = async (tags) => {
    let content;
    const useLocalFile = false;
    const templateToUse = "https://aiadvisor-ningi-cdn.s3.eu-west-2.amazonaws.com/615029cc-68d5-4e62-9c98-28b6c432e02f.docx";
    const reportOutputName = "3test12.docx";
    if (useLocalFile) {
        // Load the docx file as binary content
        content = fs.readFileSync(path.resolve(__dirname, "suitabilityReportTemplate.docx"), "binary");
    }
    if (!useLocalFile) {
        const document_url = templateToUse;
        const streamName = `/tmp/${Date.now()}.docx`;
        const file = fs.createWriteStream(streamName);
        content = await new Promise((resolve, reject) => {
            https.get(document_url, (response) => {
                var stream = response.pipe(file);
                stream.on("finish", function () {
                    fs.readFile(streamName, "binary", (err, data) => {
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
                Key: reportOutputName,
                Body: buf,
            };
            const options = { partSize: 10 * 1024 * 1024, queueSize: 1 };
            const upload = s3.upload(params, options);
            await upload.promise();
            console.log("finished - update report database");
        }
        catch {
            console.log("failed to save file to CDN");
        }
    }
};
