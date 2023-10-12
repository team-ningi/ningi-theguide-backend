/* eslint-disable */
const request = require("supertest");
const express = require("express");
const { json } = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

require("../../setup").setup();

const app = express();
app.use(json());

require("../../routes/testroutes")(app);

beforeAll(async () => {
  await request(app).post("/v1/admin/create-user").send({
    email_address: "test@ningi.co.uk",
  });
}, 30000);

afterAll(async () => {
  await request(app).post("/v1/admin/teardown");
}, 30000);

describe("API routes", () => {
  test("create like", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/admin/create-like").send({
      user_id: "test",
      content_id: "123test",
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("test like added");
  });

  test("create comment", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/admin/create-comment").send({
      user_id: "test",
      content_id: "123test",
      comment: "this is a test",
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("test comment added");
  });

  test("create content", async () => {
    expect.assertions(2);
    const res = await request(app).post("/v1/admin/create-content").send({
      author: "test author",
      user_id: "test",
      title: "the testing title",
      image_url: "http://idontexist.com/image.png",
      content: "<div><p>Hello this is my content</p></div>",
    });

    expect(res.status).toBe(200);
    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("test content added");
  });

  test("failure to create like", async () => {
    expect.assertions(1);
    const res = await request(app).post("/v1/admin/create-like").send({});

    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("failed to insert like");
  });

  test("failure to create comment", async () => {
    expect.assertions(1);
    const res = await request(app).post("/v1/admin/create-comment").send({});

    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("failed to insert comment");
  });

  test("failure to create content", async () => {
    expect.assertions(1);
    const res = await request(app).post("/v1/admin/create-content").send({});

    const theMsg = JSON.parse(res.text);
    expect(theMsg.msg).toBe("failed to insert content");
  });
});
