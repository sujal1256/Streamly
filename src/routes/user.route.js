import { Router } from "express";
import {
     changeCurrentPassword,
     getChannelDetails,
     getCurrentUser,
     getWatchHistory,
     handleLogin,
     handleLogout,
     handleRegister,
     reassignAccessTokenUsingRefreshToken,
     updateDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

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

router
     .route("/login")
     .post(handleLogin)
     .get((req, res) => res.send("Login"));
router
     .route("/logout")
     .post(verifyJwt, handleLogout)
     .get((req, res) => res.send("Logout"));
router.route("/refresh-token").post(reassignAccessTokenUsingRefreshToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/change-user").post(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, getCurrentUser);
router
     .route("/avatar")
     .patch(verifyJwt, upload.single("avatar"), updateDetails);

router.route("/channel/:username").get(verifyJwt, getChannelDetails);

router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
