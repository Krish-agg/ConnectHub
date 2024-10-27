const errorMiddleWare=(err,req,res,next)=>{
 
    err.message||="Internal Server Error";
    err.statuscode||=500;

    if(err.code===11000){
        const error=Object.keys(err.keyPattern).join(",")
        err.message=`Duplicate field- ${error}`;
        err.statuscode=400;
    }
    if(err.name==="CastError"){
        err.message=`Invalid format of ${err.path}`;
        err.status=400;
    }
    const response={
        success:false,
        message:err.message,
    }
    if(process.env.NODE_ENV.trim()==="DEVELOPMENT"){
        response.error=err;
    }
    return res.status(err.statuscode).json(response);
}
const tryCatch=(fnc)=>async(req,res,next)=>{
    try{
        await fnc(req,res,next);
    }
    catch(e){
        next(e);
    }
};
export {errorMiddleWare,tryCatch};