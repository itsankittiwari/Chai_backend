import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'  // this library is used for hide or encrypt the password or confidential content



const userSchema = new Schema(
    {
        username: {
            type:String,
            require:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true, // for make searching easier
        },
        email: {
            type:String,
            require:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fulllname: {
            type:String,
            require:true,
            trim:true,
            index:true, // for make searching easier
        },
        avatar:{
            type:String, //cloudinary url for storing the image
            require:true,
        },
        coverImage :{
              type:String,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type: String,
            require: [true,'Password is required']
        },
        refreshToken :{
            type:String,
        },
       
    },
    {
        timestamps:true
    }

)


//Here we used Hook of mongoose
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcrypt.hash(this.password,10)//it will encrypt the password 
    next()//for refer to next work
})

//here we define a custom method for check the encrypted password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username: this.username,
            fulllname :this.fulllname
        },
        process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)