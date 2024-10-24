import { v2 as cloudinary } from 'cloudinary';
 import fs from "fs"


 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOneCloudinary =async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //Upload the file on cloudnary
      const response=  await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been successfully upload
        // console.log("File is upload on cloudnary",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
      fs.unlinkSync(localFilePath) //Remove the locally saved temporary file as the upload operation got failed
      return null;  
    }
}

export {uploadOneCloudinary}