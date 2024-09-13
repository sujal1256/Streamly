import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { User } from "../models/user.model.js";
import {uploadLocalToCloudinary} from '../utils/cloudinary.util.js'

const handleRegister = async (req, res) => {
     // Get details from the user
     const { fullName, username, email, password } = req.body;

     // Validate if the details are correct or not for example checking the email id is with @ or not.
     if (
          [fullName, username, email, password].some(
               (field) => field?.trim() === ""
          )
     ) {
          throw new ApiError(401, "All fields are required.");
     }

     if (!email.includes("@")) {
          throw new ApiError(401, "Email not valid");
     }

     // Check if the user already exists, if it does then give error that the user already exists and if it isn't create a user and store it in the database.
     const existedUser = await User.findOne({
          $or: [{ username }, { email }],
     });
     console.log("User: ", existedUser);

     if (existedUser) {
          throw new ApiError(402, "username/email already exists");
     }

     // Check if the avatar and other images if any is uploaded correctly or not, if they are right upload them to cloudinary (check specially for avatar as it is required)

     
     const avatarLocalPath = req.files?.avatar?.[0]?.path;
     const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
     
     if (!avatarLocalPath) {
          throw new ApiError(400, "avatar is required");
     }

     const avatar = await uploadLocalToCloudinary(avatarLocalPath);
     const coverImage = await uploadLocalToCloudinary(coverImageLocalPath);

     console.log(avatar);
     

     if(!avatar){
          throw new ApiError(400, "Unable to upload avatar");

     }

     // create user
     const user = await User.create({
          fullName,
          avatar: avatar.url,
          coverImage: coverImage?.url || "",
          email,
          password,
          username
     })
     
     // Check for user creation
     // Then we need to send some data to the frontend we will do it with response but we will not send the encrypted password and the refresh token to the frontend, so remove them
     const createdUser = await User.findById(user._id).select(
          "-password -refershToken"
     );

     if(!createdUser){
          throw new ApiError(500, "Something went wrong while registration ")
     }

     // Send the user
     return res.status(200).json(new ApiResponse(200, createdUser, "User registered successfully" ))
};

export { handleRegister };
