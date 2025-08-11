import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccount,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJwtToken, logoutUser);

router.route("/refreshtoken").post(verifyJwtToken, refreshAccessToken);

router.route('changepassword').post(verifyJwtToken, changePassword)
router.route('getcurrentuser').post(verifyJwtToken, getCurrentUser)
router.route('update-current-details').post(verifyJwtToken, updateAccount)
router.route('update-currentuser-avatar').post(verifyJwtToken, updateUserAvatar)
router.route('update-currentuser-coverr').post(verifyJwtToken, updateUserCoverImage)
export default router;
