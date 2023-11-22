/* eslint-disable */
const request = require("supertest");
const express = require("express");
const { json } = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

require("../../setup").setup();
import userRoutes from "./../../routes/users";
import documentRoutes from "./../../routes/documents";
import templateRoutes from "./../../routes/templates";
import tagsRoutes from "./../../routes/tags";
import reportRoutes from "./../../routes/reports";
import testRoutes from "./../../routes/testroutes";

const app = express();
app.use(json());

app.use(userRoutes);
app.use(documentRoutes);
app.use(templateRoutes);
app.use(tagsRoutes);
app.use(reportRoutes);
app.use(testRoutes);

beforeAll(async () => {
  await request(app).post("/v1/admin/teardown");
}, 30000);

afterAll(async () => {
  await request(app).post("/v1/admin/teardown");
}, 30000);

const userID = "test";

describe("API routes", () => {
  /*DOCUMENTS */
  test("create a document entry", async () => {
    expect.assertions(5);
    const res = await request(app).post("/v1/aiadviser/add-document").send({
      user_id: userID,
      label: "my test file",
      file_url: "http://google.com/doesnt-exist",
      file_type: "docx",
      original_filename: "theFile.docx",
      saved_filename: "123456789.docx",
      custom_filename: "",
      metadata: {},
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("document data added");
    expect(theMsg.error).toBe(false);
    expect(theMsg.document.user_id).toBe(userID);
    expect(theMsg.document.embedding_created).toBe(false);
  });

  test("get the new document entry", async () => {
    expect.assertions(2);
    const res = await request(app)
      .post("/v1/aiadviser/get-documents-by-userid")
      .send({
        user_id: userID,
        embedded: false,
      });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg[0].saved_filename).toBe("123456789.docx");
  });

  test("search for the new document entry", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/aiadviser/search-documents").send({
      user_id: userID,
      embedded: false,
      search: "test file",
      skip: 0,
      limit: 10,
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg[0].saved_filename).toBe("123456789.docx");
  });

  test("FAIL to create a document entry", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/aiadviser/add-document").send({
      user_id: userID,
      metadata: {},
    });

    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("failed to insert document data");
    expect(theMsg.error).toBe(true);
  });

  /*TEMPLATES */
  test("create a template entry", async () => {
    expect.assertions(4);
    const res = await request(app).post("/v1/aiadviser/add-template").send({
      user_id: userID,
      label: "my test file",
      file_url: "http://google.com/doesnt-exist",
      file_type: "docx",
      original_filename: "theFile.docx",
      saved_filename: "123456789.docx",
      custom_filename: "",
      metadata: {},
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("template data added");
    expect(theMsg.error).toBe(false);
    expect(theMsg.template.user_id).toBe(userID);
  });

  test("get the new template entry", async () => {
    expect.assertions(2);
    const res = await request(app)
      .post("/v1/aiadviser/get-templates-by-userid")
      .send({
        user_id: userID,
      });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg[0].saved_filename).toBe("123456789.docx");
  });

  test("search for the new template entry", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/aiadviser/search-templates").send({
      user_id: userID,
      search: "test file",
      skip: 0,
      limit: 10,
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg[0].saved_filename).toBe("123456789.docx");
  });

  test("FAIL to create a template entry", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/aiadviser/add-template").send({
      user_id: userID,
      label: "my test file2",
      metadata: {},
    });

    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("failed to insert template data");
    expect(theMsg.error).toBe(true);
  });

  /*TAGS*/
  test("create a tag entry", async () => {
    expect.assertions(4);
    const res = await request(app)
      .post("/v1/aiadviser/add-tags")
      .send({
        user_id: userID,
        label: "my test tags",
        tags: [
          {
            tag: "first_name",
            data: "first name",
            prompt: "return {{data}} only with no other text",
            uuid: "987754456567656",
          },
        ],
        metadata: {},
      });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("tags data added");
    expect(theMsg.error).toBe(false);
    expect(theMsg.tags.user_id).toBe(userID);
  });

  test("get the new tags entry", async () => {
    expect.assertions(2);
    const res = await request(app)
      .post("/v1/aiadviser/get-tags-by-userid")
      .send({
        user_id: userID,
      });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg[0].label).toBe("my test tags");
  });

  test("FAIL to create a tags entry", async () => {
    expect.assertions(2);
    const res = await request(app)
      .post("/v1/aiadviser/add-tags")
      .send({ user_id: userID, metadata: {} });
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("failed to insert tags");
    expect(theMsg.error).toBe(true);
  });

  /*REPORTS*/
  test("create a report entry", async () => {
    expect.assertions(5);
    const res = await request(app)
      .post("/v1/aiadviser/add-report")
      .send({
        user_id: userID,
        report_name: "test report",
        report_type: "standard",
        file_type: "docx",
        tags: [
          {
            tag: "first_name",
            data: "first name",
            prompt: "return {{data}} only with no other text",
            uuid: "987754456567656",
          },
        ],
        tagResults: {
          first_name: "Gary",
        },
        base_template_url: "i_dont_exist.docx",
        generated_report_url: "i_dont_exist.docx",
        generated_report: true,
        document_ids: ["123", "456"],
        report_hidden: false,
        metadata: {},
      });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("report data added");
    expect(theMsg.error).toBe(false);
    expect(theMsg.report.user_id).toBe(userID);
    expect(theMsg.report.report_name).toBe("test report");
  });

  test("get the new report entry", async () => {
    expect.assertions(2);
    const res = await request(app)
      .post("/v1/aiadviser/get-reports-by-userid")
      .send({
        user_id: userID,
      });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg[0].report_name).toBe("test report");
  });

  test("search for the new report entry", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/aiadviser/search-reports").send({
      user_id: userID,
      search: "test report",
      report_type: "standard",
      skip: 0,
      limit: 10,
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg[0].report_name).toBe("test report");
  });

  test("FAIL to create a report entry", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/aiadviser/add-report").send({
      user_id: userID,
      metadata: {},
    });

    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("failed to insert report data");
    expect(theMsg.error).toBe(true);
  });
});
