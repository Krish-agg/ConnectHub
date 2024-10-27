import express from "express";
import { acceptFriendRequest, getAllNotifications, getMyFriends, getMyProfile, login, logout, newUser, searchUser, sendFriendRequest } from "../controllers/user.js";
import { multerUpload } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from "../lib/validators.js";

const router=express.Router({mergeParams:true});

router
.route("/login")
.post(loginValidator(),validateHandler,login)

router
.route("/new")
.post(multerUpload.single("avatar"),registerValidator(),validateHandler,newUser)

router
.route("/me")
.get(isAuthenticated,getMyProfile)
router
.route("/logout")
.get(isAuthenticated,logout)
router
.route("/search")
.get(isAuthenticated,searchUser)

router
.route("/sendrequest")
.put(isAuthenticated,sendRequestValidator(),validateHandler,sendFriendRequest)

router
.route("/acceptrequest")
.put(isAuthenticated,acceptRequestValidator(),validateHandler,acceptFriendRequest)

router
.route("/notifications")
.get(isAuthenticated,getAllNotifications)

router
.route("/friends")
.get(isAuthenticated,getMyFriends)

export default router;

