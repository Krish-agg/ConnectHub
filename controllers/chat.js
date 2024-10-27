import { ALERT,  DELETE_MSG,  NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { tryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { deleteFilesCloudinary, emitEvent, uploadFilesClodinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import {User} from "../models/user.js"; 
import { Message } from "../models/message.js";

const newGroupChat=tryCatch(async(req,res,next)=>{
    const {name,members}=req.body;


    const allMembers=[...members,req.userId];

    await Chat.create({
        name,
        groupChat:true,
        creator:req.userId,
        members:allMembers,

    });

    emitEvent(req,ALERT,allMembers,`Welcome to ${name} group`);
    emitEvent(req,REFETCH_CHATS,members);

    return res.status(201).json({
        success:true,
        message:"Group Created",
    });
})


const getMyChats=tryCatch(async(req,res,next)=>{
    
    const chats=await Chat.find({members:req.userId}).populate(
        "members",
        "name avatar"
    )

    const transformedChats=chats.map(({_id,name,members,groupChat})=>{

        const otherMember=getOtherMember(members,req.userId);
        return {
            _id,
            groupChat,
            avatar:groupChat?members.slice(0,3).map(({avatar})=>avatar.url):[otherMember.avatar.url],
            name:groupChat?name:otherMember.name,
            members:members.filter((member)=>member._id.toString() !== req.userId.toString()).map((i)=>i._id),

            
        }
    })

    

    return res.status(200).json({
        success:true,
        chats:transformedChats
    });
})

const getMyGroups=tryCatch(async(req,res,next)=>{
    const chats=await Chat.find({
        groupChat:true,
        creator:req.userId,
    }).populate("members","name avatar");

    const groups=chats.map(({members,_id,groupChat,name})=>{
        return{
            _id,
            groupChat,
            name,
            avatar:members.slice(0,3).map(({avatar})=>avatar.url),
        }
    });

    return res.status(200).json({
        success:true,
        groups,
    })
})

const addMembers=tryCatch(async(req,res,next)=>{
    const {chatId,members}=req.body;
    
    const chat=await Chat.findById(chatId);
    if(!chat) return next(new ErrorHandler("Chat not Found",404));
    if(!chat.groupChat) return next(new ErrorHandler("This is not a group Chat",400));
    if(chat.creator.toString()!== req.userId.toString())
        return next(new ErrorHandler("You  are not allow to add members",403));
    const allNewMembersPromise=members.map((i)=>User.findById(i,"name"));
    const allNewMembers=await Promise.all(allNewMembersPromise);

    const uniqueMembers=allNewMembers.filter((i)=>!chat.members.includes(i._id.toString()));
    chat.members.push(...uniqueMembers.map((i)=>i._id));

    if(chat.members.length>100)
        return next(new ErrorHandler("Group members limit reached",400));

    await chat.save();

    const allUsersName=uniqueMembers.map((i)=>i.name).join(",");

    emitEvent(req,ALERT,chat.members,
        {message:`${allUsersName} has been added to the group`,chatId}
    );
    emitEvent(req,REFETCH_CHATS,chat.members);

    return res.status(200).json({
        success:true,
        message:"Members Added Successfully",
    })
});

const removeMembers=tryCatch(async(req,res,next)=>{
    const {userId,chatId}=req.body;
    const[chat,userRemoved]=await Promise.all([Chat.findById(chatId),User.findById(userId,"name")]);
    if(!chat) return next(new ErrorHandler("Chat not Found",404));
    if(!chat.groupChat) return next(new ErrorHandler("This is not a group Chat",400));
    if(chat.creator.toString()!== req.userId.toString())
        return next(new ErrorHandler("You  are not allow to add members",403));

    if(chat.members.length<=3){
        return next(new ErrorHandler("Group must have atleast 3 members",400));
    }
    const allChatMembers=chat.members.map((i)=>i.toString());
    chat.members=chat.members.filter((i)=>i.toString()!== userId.toString());

    await chat.save();

    emitEvent(req,ALERT,chat.members,{message:`${userRemoved.name} has been removed from the group`,
        chatId,
    });
    emitEvent(req,REFETCH_CHATS,allChatMembers);

    return res.status(200).json({
        success:true,
        message:"Member Removed Successfully",
    })



});

const leaveGroup=tryCatch(async(req,res,next)=>{
    const chatId=req.params.id;
    const chat=await Chat.findById(chatId);
    if(!chat) return next(new ErrorHandler("Chat not Found",404));
    if(!chat.groupChat) return next(new ErrorHandler("This is not a group Chat",400));
    const remainingMembers=chat.members.filter((member)=>member.toString()!== req.userId.toString());
    if(remainingMembers.length<3){
        return next(new ErrorHandler("Group must have atleast 3 members",400));
    }
    if(chat.creator.toString() ===req.userId.toString()){
        const randomidx=Math.floor(Math.random()*remainingMembers.length);
        const newCreator=remainingMembers[randomidx];
        chat.creator=newCreator;
    }
    chat.members=chat.members.filter((i)=>i.toString()!== req.userId.toString());
    const [userRemoved]=await Promise.all([User.findById(req.userId,"name"),chat.save()]);
    

    emitEvent(req,ALERT,chat.members,{message:`${userRemoved.name} has been removed from the group`,chatId});
    

    return res.status(200).json({
        success:true,
        message:"You left the group",
    })



});


const sendAttachments=tryCatch(async(req,res,next)=>{
    
    const {chatId}=req.body;
    const files=req.files ||[];
    
    if(files.length<1) return next(new ErrorHandler("Please Upload Attachments",400));
    if(files.length>5) return next(new ErrorHandler("Files can't be more than 5",400));

    const [chat,me]=await Promise.all([Chat.findById(chatId),User.findById(req.userId,"name")]);
    
    if(!chat) return next(new ErrorHandler("Chat not Found",404));
    
    if(files.length<1) return next(new ErrorHandler("Please Provide attachments",400));
    const attachments=await uploadFilesClodinary(files);

    
    const messageForDB={
        content:"",
        attachments,
        sender:me._id,
        chat:chatId

    };
    const message=await Message.create(messageForDB);
    const messageForRealTime={_id:message._id,content:"",
        attachments,
        sender:{_id:me._id,name:me.name},
        chat:chatId};

    emitEvent(req,NEW_MESSAGE,chat.members,{
        message:messageForRealTime,
        chatId,
    })
    emitEvent(req,NEW_MESSAGE_ALERT,chat.members,{chatId});

    return res.status(200).json({
        success:true,
        message:message,
    })
})

const getChatDetails=tryCatch(async(req,res,next)=>{
    if(req.query.populate==="true"){
        const chat =await Chat.findById(req.params.id).populate("members","name avatar").lean();
        if(!chat) return next(new ErrorHandler("Chat not Found",404));
        chat.members=chat.members.map(({_id,name,avatar})=>(
            {
                _id,
                name,
                avatar:avatar.url,
            }
        ));
        return res.status(200).json({
            success:true,
            chat,
        })

    }
    else{
        const chat =await Chat.findById(req.params.id);
        if(!chat) return next(new ErrorHandler("Chat not Found",404));
        return res.status(200).json({
            success:true,
            chat,
        })
    }
    
     
})

const renameGroup=tryCatch(async(req,res,next)=>{
    const chatId=req.params.id;
    const {name}=req.body;

    const chat=await Chat.findById(chatId);
    if(!chat) return next(new ErrorHandler("Chat not Found",404));

    if(!chat.groupChat) return next(new ErrorHandler("This is not a group chat",400));
    if(chat.creator.toString()!== req.userId.toString())
        return next(new ErrorHandler("You  are not allow to rename the group",403));

    chat.name=name;
    await chat.save();
    emitEvent(req,REFETCH_CHATS,chat.members);
    return res.status(200).json({
        success:true,
        message:"Group renamed successfully",
    })


})

const deleteChat=tryCatch(async(req,res,next)=>{
    const chatId=req.params.id;
    const chat=await Chat.findById(chatId);
    if(!chat) return next(new ErrorHandler("Chat not Found",404));
    const members=chat.member;
    if(chat.groupChat && chat.creator.toString()!== req.userId.toString()){
        return next(new ErrorHandler("You are not allowed to delete the group",403));
    }
    if(chat.groupChat && !chat.members.includes(req.userId.toString())){
        return next(new ErrorHandler("You are not allowed to delete the group",403));
    }

    const messageWithAttachments=await Message.find({chat:chatId,attachments:{$exists:true,$ne:[]}});

    const public_ids=[];

    messageWithAttachments.forEach(({attachments})=>
        attachments.forEach(({public_id})=>public_ids.push(public_id))
    );

    await Promise.all([
        deleteFilesCloudinary(public_ids),chat.deleteOne(),Message.deleteMany({chat:chatId})
    ])

    emitEvent(req,REFETCH_CHATS,members);
    return res.status(200).json({
        success:true,
        message:"Chat deleted Successfully",
    })

})

const getMessages=tryCatch(async(req,res,next)=>{
    const chatId=req.params.id;
    const{page=1,res_per_page=20}=req.query;
    const skip=(page-1)*res_per_page;
    const chat=await Chat.findById(chatId);
    if(!chat) return next(new ErrorHandler("Chat Not Found",404));
    if(!chat.members.includes(req.userId.toString())) return next(new ErrorHandler("You are not allowed to access this chat",403));
    const [messages,totalMessagesCount]=await Promise.all([
        Message.find({chat:chatId})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(res_per_page)
        .populate("sender","name")
        .lean(),Message.countDocuments({chat:chatId}),
    ])

    const totalPages=Math.ceil(totalMessagesCount/res_per_page)||0;
    return res.status(200).json({
        success:true,
        message:messages.reverse(),totalPages
    })
});

const deleteMessages=tryCatch(async(req,res,next)=>{
    const msgId=req.params.id;
    const {chatId}=req.body;
    const chatd=await Chat.findById(chatId);
    const {sender}=await Message.findById(msgId);
    if(sender.toString()!==req.userId.toString()) return next(new ErrorHandler("You are not allowed to delete this message",401));

    if(!chatd) return next(new ErrorHandler("Chat not Found",404));
    const members=chatd.member;    
    await Message.deleteOne({_id:msgId})
    

    emitEvent(req,DELETE_MSG,members);
    return res.status(200).json({
        success:true,
        message:"Message deleted Successfully",
    })


});
export {newGroupChat,getMyChats,getMyGroups,addMembers,removeMembers,leaveGroup,sendAttachments,getChatDetails,renameGroup,deleteChat,getMessages,deleteMessages};