import mongooose from "mongoose";
import {DATABASE_NAME} from "../constants.js";

const connectDB = async () => {
    console.log(process.env.MONGODB_URL);
    
     try {
          const connectionInstance = await mongooose.connect(
               `${process.env.MONGODB_URL}/${DATABASE_NAME}`
          );
          
          console.log(
               `\n ✅ Database connected || DB Host:${connectionInstance.connection.host}`
          );
     } catch (error) {
          console.error(`❌ Error connecting to Database \n${error}`);
          process.exit(1);
     }
};

export default connectDB;