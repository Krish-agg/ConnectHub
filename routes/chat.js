import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addMembers, deleteChat, deleteMessages, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMembers, renameGroup, sendAttachments } from "../controllers/chat.js";
import { attachments } from "../middlewares/multer.js";
import { addMemberValidator, getChatdetailsValidator, getMessagesValidator, leaveGroupValidator, newGroupChatValidator, removeMemberValidator, renameGroupValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const router=express.Router({mergeParams:true});

router.use(isAuthenticated);


router
.route("/new")
.post(newGroupChatValidator(),validateHandler,newGroupChat)

router
.route("/my")
.get(getMyChats)

router
.route("/my/groups")
.get(getMyGroups)

router
.route("/addmember")
.put(addMemberValidator(),validateHandler,addMembers)

router
.route("/removemember")
.put(removeMemberValidator(),validateHandler,removeMembers)

router
.route("/leave/:id")
.delete(leaveGroupValidator(),validateHandler,leaveGroup)

router
.route("/message")
.post(attachments,sendAttachmentsValidator(),validateHandler,sendAttachments);

router
.route("/:id")
.get(getChatdetailsValidator(),validateHandler,getChatDetails)
.put(renameGroupValidator(),validateHandler,renameGroup)
.delete(getChatdetailsValidator(),validateHandler,deleteChat)


router
.route("/message/:id")
.get(getMessagesValidator(),validateHandler,getMessages)

router
.route("/deletemessage/:id")
.delete(deleteMessages)


 
export default router;

