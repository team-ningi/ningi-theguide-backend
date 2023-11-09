// /* eslint-disable */
// const request = require("supertest");
// const express = require("express");
// const { json } = require("body-parser");
// const dotenv = require("dotenv");
// dotenv.config();

// require("../../setup").setup();
// import userRoutes from "./../../routes/users";
// import contentRoutes from "./../../routes/content";
// import likeRoutes from "./../../routes/likes";
// import commentRoutes from "./../../routes/comments";
// import siteConfigRoutes from "./../../routes/site-config";
// import testRoutes from "./../../routes/testroutes";

// const app = express();
// app.use(json());

// app.use(userRoutes);
// app.use(contentRoutes);
// app.use(likeRoutes);
// app.use(commentRoutes);
// app.use(siteConfigRoutes);
// app.use(testRoutes);

// afterAll(async () => {
//   await request(app).post("/v1/admin/teardown");
// }, 30000);

// describe("API routes", () => {
//   test("create like and check count", async () => {
//     expect.assertions(4);
//     const res = await request(app).post("/v1/community/create-like").send({
//       user_id: "test",
//       content_id: "123test",
//       content_type: "tests",
//     });

//     const res2 = await request(app)
//       .post("/v1/community/count-likes-by-id")
//       .send({
//         content_id: "123test",
//       });

//     const theCount = JSON.parse(res2.text);
//     expect(theCount.count).toBe(1);
//     expect(res2.status).toBe(200);

//     expect(res.status).toBe(200);
//     const theMsg = JSON.parse(res.text);
//     expect(theMsg.msg).toBe("like added");
//   });

//   test("create comment", async () => {
//     expect.assertions(2);
//     const res = await request(app).post("/v1/community/create-comment").send({
//       user_id: "test",
//       content_id: "123test",
//       content_type: "tests",
//       comment: "this is a test",
//     });

//     expect(res.status).toBe(200);
//     const theMsg = JSON.parse(res.text);
//     expect(theMsg.msg).toBe("comment added");
//   });

//   test("create content", async () => {
//     expect.assertions(2);
//     const res = await request(app).post("/v1/community/create-content").send({
//       author: "test author",
//       user_id: "test",
//       title: "the testing title",
//       type: "tests",
//       image_url: "http://idontexist.com/image.png",
//       content: "<div><p>Hello this is my content</p></div>",
//     });

//     expect(res.status).toBe(200);
//     const theMsg = JSON.parse(res.text);
//     expect(theMsg.msg).toBe("content added");
//   });

//   test("failure to create like", async () => {
//     expect.assertions(1);
//     const res = await request(app).post("/v1/community/create-like").send({});

//     const theMsg = JSON.parse(res.text);
//     expect(theMsg.msg).toBe("failed to insert like");
//   });

//   test("failure to create comment", async () => {
//     expect.assertions(1);
//     const res = await request(app)
//       .post("/v1/community/create-comment")
//       .send({});

//     const theMsg = JSON.parse(res.text);
//     expect(theMsg.msg).toBe("failed to insert comment");
//   });

//   test("failure to create content", async () => {
//     expect.assertions(1);
//     const res = await request(app)
//       .post("/v1/community/create-content")
//       .send({});

//     const theMsg = JSON.parse(res.text);
//     expect(theMsg.msg).toBe("failed to insert content");
//   });
// });
