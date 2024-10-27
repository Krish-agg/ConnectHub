import express from "express";

import { connectDB } from "./utils/features.js";
import dotenv from "dotenv";
import { errorMiddleWare } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import cors from "cors"; 
import {v2 as cloudinary} from "cloudinary";
dotenv.config({
    path:"./.env"
})

import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoute from "./routes/admin.js";
import {createServer} from "http";
import { Server } from "socket.io";
import{v4 as uuid} from "uuid";
import { CHAT_EXITED, CHAT_JOINED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middlewares/auth.js";
//import { createUser } from "./seeders/seeduser.js";
const app=express();
const server=createServer(app);
const io=new Server(server,{cors:corsOptions});

app.set("io",io);
const port=process.env.port||3000;
const url=process.env.MONGO_URL;
const userSocketIDs=new Map();
const onlineUsers=new Set();



connectDB(url).then(()=>{
    console.log("connected to DB!");
})
.catch((err)=>{
    console.log(err);
})

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET

});


app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.urlencoded({extended:true}));


//createUser(10);
app.use("/user",userRoute);
app.use("/chat",chatRoute);
app.use("/admin",adminRoute);

app.get("/",(req,res)=>{
    res.send("Hello World");
})

io.use((socket,next)=>{
    
    cookieParser()(socket.request,socket.request.res,async(err)=> await socketAuthenticator(err,socket,next));
})
io.on("connection",(socket)=>{
    
    const user=socket.user;
   
    userSocketIDs.set(user._id.toString(),socket.id);
   
    socket.on(NEW_MESSAGE,async({chatId,members,message})=>{
        
        const messageForDB={
            content:message,
            sender:user._id,
            chat:chatId,
        };
        let msg={};
        try{
            msg=await Message.create(messageForDB);
            
        }
        catch(e){
            throw new Error(e);
        }
        console.log(msg);
        const messageForRealTime={
            content:message,
            _id:msg._id,
            sender:{
                _id:user._id,
                name:user.name,

            },
            chat:chatId,
            createdAt: new Date().toISOString(),

        }
        const usersSocket=getSockets(members);
        io.to(usersSocket).emit(NEW_MESSAGE,{
            chatId,
            message:messageForRealTime,
        });
        io.to(usersSocket).emit(NEW_MESSAGE_ALERT,{chatId});
        
    })
    socket.on(START_TYPING,({members,chatId})=>{
        const membersSockets=getSockets(members);
        socket.to(membersSockets).emit(START_TYPING,{chatId});
    })
    socket.on(STOP_TYPING,({members,chatId})=>{
        const membersSockets=getSockets(members);
        socket.to(membersSockets).emit(STOP_TYPING,{chatId});
    })
    socket.on(CHAT_JOINED,({userId,members})=>{
        onlineUsers.add(userId.toString());
        const membersSockets=getSockets(members);
        socket.to(membersSockets).emit(ONLINE_USERS,Array.from(onlineUsers));
    })
    socket.on(CHAT_EXITED,({userId,members})=>{
        onlineUsers.delete(userId.toString());
        const membersSockets=getSockets(members);
        socket.to(membersSockets).emit(ONLINE_USERS,Array.from(onlineUsers));
        
    })
    socket.on("disconnect",()=>{
        userSocketIDs.delete(user._id.toString());
        onlineUsers.delete(user._id.toString());
        socket.broadcast.emit(ONLINE_USERS,Array.from(onlineUsers));
        
    })
})
app.use(errorMiddleWare);
server.listen(port,()=>{
    console.log(`server is listing to port ${port}.`);
})

export{userSocketIDs};