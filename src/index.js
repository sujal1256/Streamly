// require("dotenv").config();

import dotenv from "dotenv";
 
import connectDB from "./db/index.db.js";
import app from "./app.js";
dotenv.config({
     path: "./env",
});

connectDB()
     .then(() => {
          app.listen(process.env.PORT || 8000, () => {
               console.log("Server is running at port at ", process.env.PORT);
               console.log(`http://localhost:${process.env.PORT}`);
               
          });
     })
     .catch((err) => {
          console.log("MongoDB Connected Failed: ", err);
     });
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
