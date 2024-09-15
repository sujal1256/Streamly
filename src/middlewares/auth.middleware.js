import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import jwt from "jsonwebtoken";

export const verifyJwt = async (req, res, next) => {
     try {
          const token =
               req.cookies?.accessToken ||
               req.header("Authorization").replace("Bearer ", "");

          if (!token) {
               throw new ApiError(401, "Unauthorized request");
          }
     
          
          const decodedToken = jwt.verify(
               token,
               process.env.ACCESS_TOKEN_SECRET
          );
          if (!decodedToken) {
               throw new ApiError(401, "Unable to verify the token");
          }
          const user = await User.findById(decodedToken._id).select(
               "-password -refreshToken"
          );

          if (!user) {
               throw new ApiError(401, "Invalid Access Token");
          }

          
          req.user = user;
          next();
     } catch (error) {
          console.error(error);
        throw new ApiError(401, `Unable to verify the token , ${error}`);
     }
};
