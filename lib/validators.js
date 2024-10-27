import {body,validationResult, param} from "express-validator";
import { ErrorHandler } from "../utils/utility.js";
const validateHandler=(req,res,next)=>{
    const errors=validationResult(req);
    const errorMessage=errors.array().map((error)=>error.msg).join(", ")
    if(errors.isEmpty()) return next();
    else next(new ErrorHandler(errorMessage,400));
}

const registerValidator=()=>[
    body("name","Please Enter Name").notEmpty(),
    body("username","Please Enter Username").notEmpty(),
    body("bio","Please Enter Bio").notEmpty(),
    body("password","Please Enter Password").notEmpty(),
    
];
const loginValidator=()=>[

    body("username","Please Enter Username").notEmpty(),
    
    body("password","Please Enter Password").notEmpty()
];
const newGroupChatValidator=()=>[

    body("name","Please Enter Name").notEmpty(),
    
    body("members").notEmpty().withMessage("Please Enter Members").isArray({min:2,max:100}).withMessage("Members must be 2-100"),
];
const addMemberValidator=()=>[

    body("chatId","Please Enter Chat ID").notEmpty(),
    
    body("members").notEmpty().withMessage("Please Enter Members").isArray({min:1,max:97}).withMessage("Members must be 1-97"),
];

const removeMemberValidator=()=>[

    body("chatId","Please Enter Chat ID").notEmpty(),
    body("userId","Please Enter User ID").notEmpty(),
    
];
const leaveGroupValidator=()=>[

    param("id","Please Enter Chat ID").notEmpty(),
    
    
];
const sendAttachmentsValidator=()=>[

    body("chatId","Please Enter Chat ID").notEmpty(),
    
    
];
const getMessagesValidator=()=>[

    param("id","Please Enter Chat ID").notEmpty(),
    
    
];
const getChatdetailsValidator=()=>[

    param("id","Please Enter Chat ID").notEmpty(),
    
    
];
const renameGroupValidator=()=>[
    body("name","Please Enter Name").notEmpty(),

    param("id","Please Enter Chat ID").notEmpty(),
    
    
];
const sendRequestValidator=()=>[
    body("userId","Please Enter User ID").notEmpty(),
    
    
];
const acceptRequestValidator=()=>[
    body("requestId","Please Enter Request ID").notEmpty(),
    body("accept").notEmpty().withMessage("Please Add accept").isBoolean().withMessage("Accept must be boolean"),
    
    
];
const adminLoginValidator=()=>[
    body("secretKey","Please Enter Secret Key").notEmpty(),
    
    
];


export{registerValidator,validateHandler,loginValidator,newGroupChatValidator,addMemberValidator,removeMemberValidator,leaveGroupValidator,sendAttachmentsValidator,getMessagesValidator,getChatdetailsValidator,renameGroupValidator,sendRequestValidator,acceptRequestValidator,adminLoginValidator};