import { Router } from "express";
import { handleLogin, handleLogout, handleRegister } from "../controllers/user.controller.js";
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

router.route("/login").post(handleLogin)
router.route("/logout").post(verifyJwt, handleLogout);
export default router;
