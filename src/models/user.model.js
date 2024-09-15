import mongoose, { Schema, model } from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
     username: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
          index: true,
     },
     email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
     },
     fullName: {
          type: String,
          required: true,
          trim: true,
          index: true,
     },
     avatar: {
          // cloudinary image url
          type: String,
          required: true,
     },
     coverImage: {
          // cloudinary image url
          type: String,
     },
     watchHistory: [
          {
               type: Schema.Types.ObjectId,
               ref: "Video",
          },
     ],
     password: {
        type: String,
        required: [true, "Password is required"]

     },
     refreshToken: {
        type: String,

     }
}, { timestamps: true});

userSchema.pre('save',async function(next){
    // if password is not modified then we donot need to encrypt it
    // it will be considered as modified when it is changed or password is initialized

    if(this.isModified('password') == false){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10); // 10 is the saltrounds
         
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign({
        _id: this._id,
        username: this.username,
        fullName: this.fullName
    }, process.env.ACCESS_TOKEN_SECRET,{expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
)
}
userSchema.methods.generateRefreshToken = async function(){
    // Refresh token in keep id of the user and it expires in around 10days as specified
    return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET,{expiresIn: process.env.REFRESH_TOKEN_EXPIRY})
}


export const User = mongoose.model("User", userSchema);
