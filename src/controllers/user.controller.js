import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      user.refreshToken = refreshToken;
      user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    }
    return null;
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  console.log("email is ", email, fullName);
  //check if all fields are recieved
  //check if fields are not empty
  if (
    [fullName, email, username, password].some(
      (field) => !field || String(field).trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  console.log("after first if condition");
  //check if username or email already exists
  const userIsExisted = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (userIsExisted) {
    throw new ApiError(409, "User already exists");
  }
  if (
    !req.files?.avatar ||
    (req.files?.avatar && req.files?.avatar?.length < 1)
  ) {
    throw new ApiError(400, "Avatar image is required");
  }
  // check if avatar and cover are recieved
  console.log("req id ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath =
    req.files?.coverImage?.length > 0 ? req.files?.coverImage[0]?.path : null;
  let coverImage = "";
  const avatarImage = await uploadFileOnCloudinary(avatarLocalPath);
  if (!avatarImage) {
    throw new ApiError(400, "Avatar image is required");
  }
  if (coverImageLocalPath) {
    coverImage = await uploadFileOnCloudinary(coverImageLocalPath);
  }
  //if yes, upload them to cloudinary, avatar is required remember
  //create object of user details before sending to db
  let user = {
    email: String(email)?.toLowerCase(),
    username: String(username)?.toLowerCase(),
    fullName,
    password,
    avatar: avatarImage?.url,
    coverImage: coverImage?.url || "",
  };
  let newUser = await User.create(user);
  //check if user is created successfully
  //remove password, refreshtoken from response before sending it to user
  const createdUser = await User.findById(newUser?._id)?.select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  //send response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //check username or email, password
  const { username, email, password } = req.body;
  //check if they are not empty
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required ");
  }
  if (!password) {
    throw new ApiError(400, "Password is required!");
  }
  //check if email or username are in our db
  const foundUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!foundUser) {
    throw new ApiError(404, "User not found");
  }
  //match password function hit
  const passWordIsMatched = await foundUser.isPasswordCorrect(password);
  console.log("passWordIsMatched is", passWordIsMatched);
  //return userdata with accesstoken
  if (!passWordIsMatched) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    foundUser._id
  );

  const loggedInUser = await User.findById(foundUser._id).select(
    "-password -refreshToken"
  );
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
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out succesfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "anauthorized request");
    }

    const jwtIsVerified = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!jwtIsVerified) {
      throw new ApiError(401, "invalid refresh token");
    }

    const foundUser = await User.findById(jwtIsVerified._id);

    if (!foundUser) {
      throw new ApiError(401, "invalid refresh token2");
    }

    if (incomingRefreshToken !== foundUser.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      foundUser._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          accessToken,
          refreshToken,
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.messsage || "Something went wrong while refreshing token"
    );
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "please enter all fields!");
  }
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "no user found");
  }

  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "anauthorized request");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"));
});

const updateAccount = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "all fields are required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshtoken");

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "user updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  const avatar = await uploadFileOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshtoken");

  res.status(200).json(new ApiResponse(200, user, "user updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;

  if (!coverLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  const coverImage = await uploadFileOnCloudinary(coverLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(400, "error while uploading coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshtoken");

  res.status(200).json(new ApiResponse(200, user, "user updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "channel",
        localField: "_id",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "subscriber",
        localField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
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
        email: 1,
        subscribers: 1,
        subscribedTo: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel.length) {
    throw new ApiError(404, "no data found");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        data: channel[0],
      },
      "user channel fetched successfully!"
    )
  );
});

const getUsersWatchHistory = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const user = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "watchHistory",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "owner",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
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
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        user_watch_history: 1,
      },
    },
  ]);

  if (!user.length) {
    throw new ApiError(404, "no data found");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        data: user[0].watchHistory,
      },
      "user watch history fetched successfully!"
    )
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccount,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUsersWatchHistory,
};
