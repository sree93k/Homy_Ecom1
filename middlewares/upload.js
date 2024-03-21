const multer=require("multer")
const path=require("path")

const storageSingle=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/images/adminpage'))
    },
    filename:function(req,file,cb){
        const name=Date.now()+"-"+file.originalname
        cb(null,name)
    }
})
console.log("single storage", storageSingle);

const uploadSingle = multer({
    storage: storageSingle,
    limits: {
      fileSize: 1024 * 1024 * 5, 
    },
  }).array('productImage', 3); 

console.log("uploads,",uploadSingle);

module.exports={uploadSingle}
