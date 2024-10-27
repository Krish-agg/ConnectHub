import { compare } from "bcrypt";
import { User } from "../models/user.js";
import { cookieOptions, emitEvent, sendToken, uploadFilesClodinary } from "../utils/features.js";
import { tryCatch } from "../middlewares/error.js";
import {ErrorHandler} from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";

//create a new User
const newUser=tryCatch(async(req,res,next)=>{
    const {name,username,password,bio}=req.body;
    console.log(req.body);
    const file=req.file;
    console.log(file);
    if(!file)return next(new ErrorHandler("Please Upload Avatar",400));
    const result=await uploadFilesClodinary([file]);
    const avatar={
        public_id:result[0].public_id,
        url:result[0].url,
    }
    const user=await User.create({name,bio,username,password,avatar})
    sendToken(res,user,201,"User created");
})

const login=tryCatch(async(req,res,next)=>{
  
    const{username,password}=req.body;
    const user=await User.findOne({username}).select("+password");
    if(!user) return  next(new ErrorHandler("Invalid Username",400)); 

    const isMatch=await compare(password,user.password);
    if(!isMatch) return next(new ErrorHandler("Invalid Password",400));
    sendToken(res,user,200,`Welcome Back,${user.name}`);
    
    
})

const getMyProfile=tryCatch(async(req,res,next)=>{
    const UserData=await User.findById(req.userId);
    if(!UserData) return next(new ErrorHandler("User not found",404))
    return res.status(200).json({
        success:true,
        UserData,
    })
})

const logout=tryCatch(async(req,res)=>{
    
    return res.status(200).cookie("ConnectHub-token","",{...cookieOptions,maxAge:0}).json({
        success:true,
        message:"Logged out successfully"
    })
})
const searchUser=tryCatch(async(req,res)=>{
    const {name=""}=req.query;
    const myChats=await Chat.find({groupChat:false,members:req.userId})
    const allUsersFromMyChats=myChats.map((chat)=>chat.members).flat();
    allUsersFromMyChats.push(req.userId);
    const otherUsers=await User.find({_id:{$nin:allUsersFromMyChats},name:{$regex:name,$options:"i"}});
    const users=otherUsers.map(({_id,name,avatar})=>({_id,name,avatar:avatar.url}))
    return res.status(200).json({
        success:true,
        message:users
    })
})

const sendFriendRequest=tryCatch(async(req,res,next)=>{
    
    const {userId}=req.body;
    const request=await Request.findOne({
        $or:[
            {sender:req.userId,receiver:userId},
            {sender:userId,receiver:req.userId},
        ]
    });

    if(request) return next(new ErrorHandler("Request already sent",400));

    await Request.create({
        sender:req.userId,
        receiver:userId,

    })
    
    emitEvent(req,NEW_REQUEST,[userId],"A Friend Request received");
    


    return res.status(200).json({
        success:true,
        message:"Friend Request Sent"
    })
})
const acceptFriendRequest=tryCatch(async(req,res,next)=>{
    
    const {requestId,accept}=req.body;
    const request=await Request.findById(requestId).populate("sender","name").populate("receiver","name");
    
    if(!request) return next(new ErrorHandler("Request not sent",404));
    if(request.receiver._id.toString()!== req.userId.toString())
        return next(new ErrorHandler("You are not authorized to accept the request",401))

    if(!accept){
        await Request.deleteOne({_id:requestId});
        return res.status(200).json({
            success:true,
            message:"Friend Request Rejected"
        })
    }

    const members=[request.sender._id,request.receiver._id];
    await Promise.all([
        Chat.create({
            members,
            name:`${request.sender.name}-${request.receiver.name}`,
            //creator:request.sender.name,
        }),request.deleteOne(),
    ])
    emitEvent(req,REFETCH_CHATS,members);
    


    return res.status(200).json({
        success:true,
        message:"Friend Request Accepted",
        senderId:request.sender._id,
    })
});

const getAllNotifications=tryCatch(async(req,res,next)=>{
    const requests=await Request.find({receiver:req.userId}).populate("sender","name avatar");
    
    const allRequests=requests.map(({_id,sender})=>({
        _id,sender:{
            _id:sender._id,
            name:sender.name,
            avatar:sender.avatar.url,
        }
    }));
    
    return res.status(200).json({
        success:true,
        allRequests:allRequests,
    });
});
const getMyFriends=tryCatch(async(req,res,next)=>{
    
    const chatId=req.query.chatId;
    const chats=await Chat.find({members:req.userId,groupChat:false}).populate("members","name avatar");
    const friends=chats.map(({members})=>{
        const otherUser=getOtherMember(members,req.userId);
        return{
            _id:otherUser._id,
            name:otherUser.name,
            avatar:otherUser.avatar.url,
        }
    })
    if(chatId){
        const chat=await Chat.findById(chatId);
        const availableFriends=friends.filter((friend)=>!chat.members.includes(friend._id));
        return res.status(200).json({
            success:true,
            friends:availableFriends,
        });

    }
    else{
        return res.status(200).json({
            success:true,
            friends,
        });
    }
    
    
});
export {login,newUser,getMyProfile,logout,searchUser,sendFriendRequest,acceptFriendRequest,getAllNotifications,getMyFriends};