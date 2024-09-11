import { Router } from "express";
import { handleRegister } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(handleRegister).get((req,res)=>{
    res.send("Hello")
});

export default router;
