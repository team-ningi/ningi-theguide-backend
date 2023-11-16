"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const https = require("https");
const reports_model_1 = require("../../routes/db/reports-model");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const helper_1 = require("../../routes/helper");
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.NEXT_PUBLIC_AWS_KEY_REGION,
});
/* docs : basic.dox  | suitabilityReportTemplate.docx */
exports.default = async (tags, reportId, templateURL, outputName) => {
    let content;
    const useLocalFile = false;
    if (useLocalFile) {
        // Load the docx file as binary content
        content = fs.readFileSync(path.resolve(__dirname, "suitabilityReportTemplate.docx"), "binary");
    }
    if (!useLocalFile) {
        const document_url = await (0, helper_1.getPresignedUrl)(`${templateURL}`); //document_url
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
                Key: outputName,
                Body: buf,
            };
            const command = new PutObjectCommand(params);
            await s3Client.send(command);
            await reports_model_1.reportsModel.findOneAndUpdate({ _id: reportId }, {
                generated_report_url: `${outputName}`,
                generated_report: true,
            }, {
                new: true,
                upsert: false,
            });
            return;
        }
        catch {
            console.log("failed to save file to CDN");
        }
    }
};
