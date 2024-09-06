// require("dotenv").config();

import dotenv from 'dotenv'

import mongoose, { connect, mongo } from "mongoose";
import { DATABASE_NAME } from "./constants.js";
import connectDB from "./db/index.db.js";

dotenv.config({
    path: './env'
});

connectDB();
/*
import express from "express";
const app = express();
(async () => {
     try {
          await mongoose.connect(
               `${process.env.MONGODB_URL}/${DATABASE_NAME}`,
               () => {
                    console.log("✅ Mongoose Connected");
               }
          );

          app.on("error", (error) => {
               console.error(`❌ Error with Express`, error);
               throw error;
          });

          app.listen(process.env.PORT, () => {
               console.log(`✅ App is listening on ${process.env.PORT}`);
          });
     } catch (error) {
          console.error("❌ Error", error);
          throw error;
     }
})();
*/
