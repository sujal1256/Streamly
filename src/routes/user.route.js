import { Router } from "express";
import { handleRegister } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
     .route("/register")
     .post(
          upload.fields([
               {
                    name: "avatar",
                    maxCount: 1,
               },
               {
                    name: "coverImage",
                    maxCount: 1,
               },
          ]),
          handleRegister
     )
     .get((req, res) => {
          res.send("Hello");
     });

export default router;
