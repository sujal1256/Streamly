import { Router } from "express";
import { handleLogin, handleLogout, handleRegister, reassignAccessTokenUsingRefreshToken } from "../controllers/user.controller.js";
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

router.route("/login").post(handleLogin).get((req, res)=>res.send("Login"))
router.route("/logout").post(verifyJwt, handleLogout).get((req, res)=>res.send("Logout"));
router.route("/refresh-token").post(reassignAccessTokenUsingRefreshToken);

export default router;
