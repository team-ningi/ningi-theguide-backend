// // @ts-nocheck
// import { Router } from "express";
// import nocache from "nocache";
// import { usersModel } from "./db/users-model";
// import usersCreator from "./db/users-creator";
// import likesCreator from "./db/likes-creator";
// import { likesModel } from "./db/likes-model";
// import commentsCreator from "./db/comments-creator";
// import { commentsModel } from "./db/comments-model";
// import contentCreator from "./db/content-creator";
// import { contentModel } from "./db/content-model";

// const router = Router();

// router.post("/v1/admin/create-user", nocache(), async (req, res) => {
//   try {
//     const { email_address } = req.body;

//     if (email_address !== "test@ningi.co.uk")
//       return res.json({
//         error: true,
//         msg: "failure to create admin user",
//       });

//     const result = await usersModel
//       .findOne({
//         email: email_address,
//       })
//       .lean()
//       .exec();

//     if (result) {
//       return res.json({
//         error: true,
//         msg: "admin user exists",
//       });
//     }

//     const newUser = {
//       email: email_address,
//     };
//     await usersCreator(newUser);

//     const updated = await usersModel.findOneAndUpdate(
//       { email: email_address },
//       {
//         email: email_address,
//         first_name: "",
//         last_name: "",
//         phone_number: "",
//         address_line1: "",
//         address_line2: "",
//         address_line3: "",
//         role: "admin",
//         metadata: {},
//       },
//       {
//         new: true,
//         upsert: false,
//       }
//     );
//     res.json(updated);
//   } catch (e) {
//     console.log(e);
//     return res.json({
//       error: true,
//       msg: "failed to insert admin user",
//     });
//   }
// });

// // router.post("/v1/admin/create-like", nocache(), async (req, res) => {
// //   try {
// //     if (!req.body.user_id) {
// //       throw new Error(" thrown error in test");
// //     }

// //     const newLike = {
// //       user_id: req.body.user_id,
// //       content_id: req.body.content_id,
// //       content_type: "test",
// //       metadata: {},
// //     };
// //     await likesCreator(newLike);

// //     return res.json({
// //       msg: "test like added",
// //     });
// //   } catch (e) {
// //     console.log(e);
// //     return res.json({
// //       error: true,
// //       msg: "failed to insert like",
// //     });
// //   }
// // });

// // router.post("/v1/admin/create-comment", nocache(), async (req, res) => {
// //   try {
// //     if (!req.body.user_id) {
// //       throw new Error(" thrown error in test");
// //     }

// //     const newComment = {
// //       user_id: req.body.user_id,
// //       content_id: req.body.content_id,
// //       content_type: "test",
// //       comment: req.body.comment,
// //       metadata: {},
// //     };
// //     await commentsCreator(newComment);

// //     return res.json({
// //       msg: "test comment added",
// //     });
// //   } catch (e) {
// //     console.log(e);
// //     return res.json({
// //       error: true,
// //       msg: "failed to insert comment",
// //     });
// //   }
// // });

// // router.post("/v1/admin/create-content", nocache(), async (req, res) => {
// //   try {
// //     if (!req.body.user_id) {
// //       throw new Error(" thrown error in test");
// //     }

// //     const newContent = {
// //       author: req.body.author,
// //       user_id: req.body.user_id,
// //       title: req.body.title,
// //       image_url: req.body.image_url,
// //       content: req.body.content,
// //       type: "test",
// //       metadata: {},
// //     };
// //     await contentCreator(newContent);

// //     return res.json({
// //       msg: "test content added",
// //     });
// //   } catch (e) {
// //     console.log(e);
// //     return res.json({
// //       error: true,
// //       msg: "failed to insert content",
// //     });
// //   }
// // });

// router.post("/v1/admin/teardown", nocache(), async (req, res) => {
//   try {
//     console.log("teardown started");
//     await likesModel.deleteMany({
//       content_type: "test",
//     });

//     await commentsModel.deleteMany({
//       content_type: "test",
//     });

//     await contentModel.deleteMany({
//       type: "test",
//     });

//     await usersModel.findOneAndRemove({
//       email: "test@ningi.co.uk",
//     });

//     return res.json({
//       error: false,
//       msg: "Teardown complete",
//     });
//   } catch (e) {
//     console.log(e);
//     return res.json({
//       error: true,
//       msg: "failed to complete the teardown",
//     });
//   }
// });

// export default router;
