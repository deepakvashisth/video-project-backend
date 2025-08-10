import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwtToken = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.headers["Authorization"]?.replace("Bearer ", "");
    if (!accessToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const foundUser = User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    req.user = foundUser;
    next();
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong white verifying token "
    );
  }
});
