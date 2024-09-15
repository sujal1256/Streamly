import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { User } from "../models/user.model.js";
import { uploadLocalToCloudinary } from "../utils/cloudinary.util.js";

const generateAccessTokenAndRefershTokens = async (user) => {
     try {
          const { _id: userId } = user;
          console.log(userId);

          const accessToken = user.generateAccessToken();
          const refreshToken = user.generateRefreshToken();

          user.refreshToken = refreshToken;
          await user.save({ validateBeforeSave: false });
     } catch (error) {
          throw new ApiError(
               500,
               "Something went wrong while generating Access and Refresh tokens"
          );
     }

     return { refreshToken, accessToken };
};

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

     if (!avatar) {
          throw new ApiError(400, "Unable to upload avatar");
     }

     // create user
     const user = await User.create({
          fullName,
          avatar: avatar.url,
          coverImage: coverImage?.url || "",
          email,
          password,
          username,
     });

     // Check for user creation
     // Then we need to send some data to the frontend we will do it with response but we will not send the encrypted password and the refresh token to the frontend, so remove them
     const createdUser = await User.findById(user._id).select(
          "-password -refreshToken"
     );

     if (!createdUser) {
          throw new ApiError(500, "Something went wrong while registration ");
     }

     // Send the user
     return res
          .status(200)
          .json(
               new ApiResponse(200, createdUser, "User registered successfully")
          );
};

const handleLogin = async (req, res) => {
     // Get data from the request
     const { username, email, password } = req.body;

     // Check if the data is ok
     if (!username || !email || !password) {
          throw new ApiError(400, "Credentails not found");
     }

     // Find user based on the credentials
     const user = await User.findOne({
          $or: [{ username }, { email }],
     });
     // Check the user
     if (!user) {
          throw new ApiError(404, "User doesn't exist");
     }
     console.log(user);

     // Check password
     const isPasswordCorrect = await user.isPasswordCorrect(password);

     if (!isPasswordCorrect) {
          throw new ApiError(404, "Invalid Credentials");
     }

     // Generate refresh token and access token
     const { refreshToken, accessToken } =
          await generateAccessTokenAndRefershTokens(user);
     // Here the user is added a refresh token but "user" is refering to old object which does not have refresh token
     // so we will again run a DB query

     // And in the loggedInUser object we donot need password and refreshToken because they are saved in database, we will use .select() method

     const loggedInUser = await User.findById(user._id).select(
          "-password -refreshToken"
     );

     // Send token in cookies
     // Doing this only server will be able to modify the cookies, frontend won't be able to do it
     const options = {
          httpOnly: true,
          secure: true,
     };

     return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
               new ApiResponse(
                    200,
                    { user: loggedInUser, accessToken, refreshToken },
                    "User logged in successfully"
               )
          );
};

const handleLogout = async (req, res) => {
     const user = req.user;
     await User.findByIdAndUpdate(user._id, {
          $set: {
               refreshToken: undefined,
          },
     });

     const options = {
          httpOnly: true,
          secure: true,
     };

     return res
          .status(200)
          .clearCookie("accessToken", options)
          .clearCookie("refreshToken", options)
          .json(new ApiResponse(200, {}, "User Loggedout successfully"));
};
export { handleRegister, handleLogin, handleLogout };
