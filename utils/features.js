import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {v4 as uuid} from "uuid";
import {v2 as cloudinary} from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";
const cookieOptions={
    maxAge:24*60*60*1000*15,
    httpOnly:true,
    sameSite:"none",
    secure:true
}
const connectDB=async function(url) {
    await mongoose.connect(url,{dbName:"ConnectHub"});
}


const sendToken=(res,user,code,message)=>{
    const token=jwt.sign({_id:user._id},process.env.JWT_SECRET);
    return res.status(code).cookie("ConnectHub-token",token,cookieOptions).json({
        success:true,
        user,
        message,
    })
}

const emitEvent=(req,event,users,data)=>{
    const io=req.app.get("io");
    const usersSocket=getSockets(users);
    io.to(usersSocket).emit(event,data);
};

const deleteFilesCloudinary=async(public_ids)=>{

};

const uploadFilesClodinary=async(files=[])=>{
    const uploadPromises=files.map((file)=>{
        
        return new Promise((resolve,reject)=>{
            
            cloudinary.uploader.upload(getBase64(file),{
                resource_type:"auto",
                public_id:uuid(),
            },(error,result)=>{
                
                if(error) return reject(error);
                resolve(result);
            })
        })
    });
    try{
        const results=await Promise.all(uploadPromises);
        console.log(results);
        const formattedResults=results.map((result)=>({
            public_id:result.public_id,
            url:result.secure_url,
        }));
        return formattedResults;
    }
    catch(e){
        throw new Error("Error uploading files to cloudinary",e);
    }
};
export {connectDB,sendToken,cookieOptions,emitEvent,deleteFilesCloudinary,uploadFilesClodinary};