// local file (local server) to cloudinary server
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadLocalToCloudinary = async (localFilePath) => {
    try{
        if( !localFilePath ) return null;

        // localFilePath exists, upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // File is uploaded successfully
        console.log("File is uploaded on cloudinary,\n Response\n",response.url);
        fs.unlinkSync(localFilePath); 
        return response;
        
    }
    catch(error){
        // Execute this work and then go ahead
        // remove locally saved file as upload operation is failed
        fs.unlinkSync(localFilePath); 

         


    }
}

export {uploadLocalToCloudinary};