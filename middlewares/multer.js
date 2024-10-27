import multer from "multer";

const multerUpload=multer({limits:{
    fileSize:1024*1024*5,
}});


const attachments=multerUpload.array("files",5);

export {multerUpload,attachments}