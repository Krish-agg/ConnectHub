import express from "express";
import { adminLogin, adminLogout, getAdminData, getAllChats, getAllMessages, getAllUsers, getDashboardStats } from "../controllers/admin.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminOnly } from "../middlewares/auth.js";

const router=express.Router({mergeParams:true});



router
.route("/verify")
.post(adminLoginValidator(),validateHandler,adminLogin)

router
.route("/logout")
.get(adminLogout)

router.use(adminOnly);
router
.route("/")
.get(getAdminData)


router
.route("/users")
.get(getAllUsers)

router
.route("/chats")
.get(getAllChats)

router
.route("/messages")
.get(getAllMessages)

router
.route("/stats")
.get(getDashboardStats)


export default router;