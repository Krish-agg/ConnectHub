import { tryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { cookieOptions } from "../utils/features.js";
import {ErrorHandler} from "../utils/utility.js";
import jwt from "jsonwebtoken";


const adminLogin=tryCatch(async(req,res,next)=>{
    const {secretKey}=req.body;
    const adminSecretKey=process.env.ADMIN_SECRET_KEY||"KA321";
    const isMatch=secretKey===adminSecretKey;
    if(!isMatch) return next(new ErrorHandler("Invalid Admin Key",401));
    const token=jwt.sign(secretKey,process.env.JWT_SECRET);
    return res.status(200).cookie("Connect-Admin",token,{...cookieOptions,maxAge:1000*60*15}).json({
        success:true,
        message:"Authenticated Successfully,Welcome Administrator."
    });

});

const getAdminData=tryCatch(async(req,res,next)=>{
    return res.status(200).json({
        admin:true,
    })
})

const getAllUsers=tryCatch(async(req,res,next)=>{
    const users=await User.find({});
    const transformedUsers=await Promise.all(users.map(async({name,username,avatar,_id})=>{
        const [groupCount,friendCount]=await Promise.all([Chat.countDocuments({groupChat:true,members:_id}),Chat.countDocuments({groupChat:false,members:_id})]) 
        return {
            name,
            username,
            avatar:avatar.url,
            _id,
            groupCount,
            friendCount,
        }
    }));
    res.status(200).json({
        status:"success",
        transformedUsers,
    });
});

const getAllChats=tryCatch(async(req,res,next)=>{

    const chats=await Chat.find({}).populate("members","name avatar").populate("creator","name avatar");

    const transformedChats=await Promise.all(chats.map(async({members,groupChat,_id,name,creator})=>{
        const totalMessages=await Message.countDocuments({chat:_id});
        return{
            name,_id,
            groupChat,
            avatar:members.slice(0,3).map((member)=>member.avatar.url),
            members:members.map(({avatar,_id,name})=>{
                return{
                    _id,
                    name,
                    avatar:avatar.url,
                };

            }),
            creator:{
                name:creator?.name||"None",
                avatar:creator?.avatar.url||"",
            },
            totalMembers:members.length,
            totalMessages,
        }
    }));
    
    res.status(200).json({
        status:"success",
        transformedChats,
    });
});

const getAllMessages=tryCatch(async(req,res,next)=>{
    const messages=await Message.find({}).populate("sender","name avatar").populate("chat","groupChat");
    const transformedMessages=messages.map(({content,attachments,_id,sender,chat,createdAt})=>{
        return {
            _id,attachments,content,createdAt,
            chat:chat._id,
            groupChat:chat.groupChat,
            sender:{
                _id:sender._id,
                name:sender.name,
                avatar:sender.avatar.url,
            },
        }
    })
    return res.status(200).json({
        success:true,
        messages:transformedMessages,
    })
});

const getDashboardStats=tryCatch(async(req,res,next)=>{
    const [groupCount,usersCount,messageCount,totalChatsCount]=await Promise.all([Chat.countDocuments({groupChat:true}),User.countDocuments(),Message.countDocuments(),Chat.countDocuments()]);

    const today=new Date();
    const last7days=new Date();
    last7days.setDate(last7days.getDate()-7);
    const last7DaysMessages=await Message.find({createdAt:{$gte:last7days,$lte:today}}).select("createdAt");
    const messages=new Array(7).fill(0);
    last7DaysMessages.forEach(message=>{
        const indexApprox=(today.getTime()-message.createdAt.getTime())/(1000*60*60*24);
        const index=Math.floor(indexApprox);
        messages[6-index]++;
    })

    
    const stats={
        groupCount,
        usersCount,messageCount,
        totalChatsCount,
        messagesChart:messages,
    }

    return res.status(200).json({
        success:true,
        stats:stats,
    })
});

const adminLogout=tryCatch(async(req,res,next)=>{
    return res.status(200).cookie("Connect-Admin","",{...cookieOptions,maxAge:0}).json({
        success:true,
        message:"Logged Out Successfully"
    });

});

export {getAllUsers,getAllChats,getAllMessages,getDashboardStats,adminLogin,adminLogout,getAdminData};