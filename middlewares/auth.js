import { CONNECT_HUB } from "../constants/config.js";
import { User } from "../models/user.js";
import {ErrorHandler} from "../utils/utility.js";
import jwt from "jsonwebtoken";


const isAuthenticated=(req,res,next)=>{
    const token=req.cookies[CONNECT_HUB];
    if(!token)return next(new ErrorHandler("Please login to access this page",401));
    
    const decodedData=jwt.verify(token,process.env.JWT_SECRET);
    req.userId=decodedData._id;
    next();
}
const adminOnly=(req,res,next)=>{
    const token=req.cookies["Connect-Admin"];
    if(!token)return next(new ErrorHandler("Only Admin can access this page",401));
    
    const secretKey=jwt.verify(token,process.env.JWT_SECRET);
    const adminSecretKey=process.env.ADMIN_SECRET_KEY||"KA321";
    const isMatch=secretKey===adminSecretKey;
    if(!isMatch)return next(new ErrorHandler("Invalid Admin Key",401));
    next();
}

const socketAuthenticator=async(err,socket,next)=>{
    try{
        if(err){
            return next(err);
        }
        const authToken=socket.request.cookies[CONNECT_HUB];
        if(!authToken)return next(new ErrorHandler("Please login to access this route",401));
        const decodedData=jwt.verify(authToken,process.env.JWT_SECRET);
        const user=await User.findById(decodedData._id);
        if(!user) return next(new ErrorHandler("Please login to access this route",401));
        socket.user=user;


        return next();


    }
    catch(e){
        return next(new ErrorHandler("Please login to access this route",401));
    }
}

export {isAuthenticated,adminOnly,socketAuthenticator}