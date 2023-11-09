// @ts-nocheck
import { Router } from "express";
import nocache from "nocache";
import { usersModel } from "./db/users-model";
import usersCreator from "./db/users-creator";

const router = Router();

router.post("/v1/admin/create-user", nocache(), async (req, res) => {
  try {
    const { email_address } = req.body;

    if (email_address !== "test@ningi.co.uk")
      return res.json({
        error: true,
        msg: "failure to create test user",
      });

    const result = await usersModel
      .findOne({
        uuid: "test12345",
      })
      .lean()
      .exec();

    if (result) {
      return res.json({
        error: true,
        msg: "test user exists",
      });
    }

    const newUser = {
      uuid: "test12345",
      email: email_address,
    };
    await usersCreator(newUser);

    const updated = await usersModel.findOneAndUpdate(
      { uuid: "test12345" },
      {
        uuid: "test12345",
        role: "admin",
      },
      {
        new: true,
        upsert: false,
      }
    );
    res.json(updated);
  } catch (e) {
    console.log(e);
    return res.json({
      error: true,
      msg: "failed to insert admin user",
    });
  }
});

router.post("/v1/admin/teardown", nocache(), async (req, res) => {
  try {
    console.log("teardown started");
    // await likesModel.deleteMany({
    //   content_type: "tests",
    // });

    // await commentsModel.deleteMany({
    //   content_type: "tests",
    // });

    // await contentModel.deleteMany({
    //   type: "tests",
    // });

    await usersModel.findOneAndRemove({
      uuid: "test12345",
    });

    return res.json({
      error: false,
      msg: "Teardown complete",
    });
  } catch (e) {
    console.log(e);
    return res.json({
      error: true,
      msg: "failed to complete the teardown",
    });
  }
});

export default router;
