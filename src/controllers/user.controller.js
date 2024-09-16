import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { User } from "../models/user.model.js";
import { uploadLocalToCloudinary } from "../utils/cloudinary.util.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefershTokens = async (userId) => {
     try {
          const user = await User.findById(userId);
          console.log(userId);

          const accessToken = await user.generateAccessToken();
          const refreshToken = await user.generateRefreshToken();
          console.log("Tokens", accessToken, refreshToken);

          user.refreshToken = refreshToken;
          await user.save({ validateBeforeSave: false });
          return { refreshToken, accessToken };
     } catch (error) {
          throw new ApiError(
               500,
               "Something went wrong while generating Access and Refresh tokens"
          );
     }
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

     console.log(username);

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
          await generateAccessTokenAndRefershTokens(user._id);
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
     console.log("Logging out", user._id);

     await User.findByIdAndUpdate(user._id, {
          $set: {
               refreshToken: "",
          },
     });
     console.log("Refresh token: ", user.refreshToken);

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

const reassignAccessTokenUsingRefreshToken = async (req, res) => {
     const incomingRefreshToken =
          req.cookies.refreshToken || req.body.refreshToken;

     if (!incomingRefreshToken) {
          throw new ApiError(
               401,
               "Unautorized request\n Refresh token not found"
          );
     }

     const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
     );
     const user = await User.findById(decodedToken._id);

     if (!user) {
          throw new ApiError(401, "Error in Decoding the refreshToken");
     }

     if (incomingRefreshToken !== user?.refreshToken) {
          throw new ApiError(401, "Refresh token is expired");
     }

     const options = {
          httpOnly: true,
          secure: true,
     };

     const { accessToken, refreshToken: newRefreshToken } =
          await generateAccessTokenAndRefershTokens(user._id);

     return (
          res
               .status(200)
               .cookie("accessToken", accessToken, options)
               // FIXME: make a middleware for get request where it will check if the access token is there or not if not hit the end-point
               .cookie("refreshToken", incomingRefreshToken, options)
               .json(
                    new ApiResponse(
                         200,
                         { accessToken, refreshToken: incomingRefreshToken },
                         "Access token refreshed"
                    )
               )
     );
};

const changeCurrentPassword = async (req, res) => {
     const { oldPassword, newPassword } = req.body;

     const user = await User.findById(req.user?._id);

     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
     if (!isPasswordCorrect) {
          throw new ApiError(401, "Incorrect Password");
     }

     user.password = newPassword;
     await user.save({ validateBeforeSave: true });

     return res
          .send(200)
          .json(new ApiResponse(200, {}, "Password Changed Successfully"));
};

const getCurrentUser = async (req, res) => {
     return res.status(200, req.user, "Current user fetched successfully");
};

const updateDetails = async (req, res) => {
     const { fullName, email } = req.body;

     if (!fullName || !email) {
          throw new ApiError(401, "All fields are required");
     }

     const user = User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    fullName: fullName,
                    email: email,
               },
          },
          // using this it returns the new update contents
          { new: true }
     ).select("-password");

     return res
          .status(200)
          .json(
               new ApiResponse(200, user, "Account Details Update Successfully")
          );
};

const updateAvatar = async (req, res) => {
     const updatedAvatarLocalLocation = req.file?.path;

     if (!updatedAvatarLocalLocation) {
          throw new ApiError(401, "Avatar file is missing");
     }

     const avatar = await uploadLocalToCloudinary(updatedAvatarLocalLocation);

     if (!avatar.url) {
          throw new ApiError(401, "Error while uploading on avatar");
     }

     const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    avatar: avatar.url,
               },
          },
          { new: true }
     ).select("-password");

     return res
          .status(200)
          .json(new ApiResponse(200, user, "Avatar updated successfully"));
};

const getChannelDetails = (req, res) => {
     const username = req.params;

     if (!username) {
          throw new ApiError(400, "username not found");
     }

     // Aggregation Pipeline
     const channel = User.aggregate([
          // 1st stage
          {
               $match: {
                    username: username?.toLowerCase(),
               },
          },
          {
               // Number of subscribers
               $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
               },
          },
          {
               // Number of channel subscribed
               $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo",
               },
          },
          {
               // To add more fields
               $addFields: {
                    subscriberCount: {
                         $size: "$subscribers",
                    },
                    channelsSubscribedToCount: {
                         $size: "$subscribedTo",
                    },
                    isSubscribed: {
                         $cond: {
                              if: {
                                   $in: [
                                        req.user?._id,
                                        "$subscribers.subscriber",
                                   ],
                              },
                              then: true,
                              else: false,
                         },
                    },
               },
          },
          {
               $project: {
                    fullName: 1,
                    username: 1,
                    subscriberCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
               },
          },
     ]);

     if (!channel?.length) {
          throw new ApiError("Channel does not exist");
     }

     return res
          .status(200)
          .json(
               new ApiResponse(
                    200,
                    channel[0],
                    "Number of subscribers and channels subscribed to"
               )
          );
};

const getWatchHistory = async (req, res) => {
     const user = User.aggregate([
          {
               $match: {
                    // we didn't use req.user._id because it is actually a string not an id so we need to convert it into an id it happens automatically when we work outside of the aggregation pipelines
                    _id: new mongoose.Schema.Types.ObjectId(req.user._id),
               },
          },
          {
               $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                         {
                              $lookup: {
                                   from: "users",
                                   localField: "owner",
                                   foreignField: "_id",
                                   as: "owner",
                                   // Now we want to reduce the number of fields user is sending
                                   pipeline: [
                                        {
                                             $project: {
                                                  fullName: 1,
                                                  username: 1,
                                                  avatar: 1,
                                             },
                                        },
                                        {},
                                   ],
                              },
                         },
                         {
                              $addFields: {
                                   owner: {
                                        $first: "$owner",
                                   },
                              },
                         },
                    ],
               },
          },
     ]);

     return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully"))
};

export {
     handleRegister,
     handleLogin,
     handleLogout,
     reassignAccessTokenUsingRefreshToken,
     changeCurrentPassword,
     getCurrentUser,
     updateDetails,
     getChannelDetails,
     getWatchHistory
};
