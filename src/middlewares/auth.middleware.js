import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.moel";

export const verifyJWT = asyncHandler(async(req,res,next) =>{
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
     // if user not have token then 
     if(!token){
         throw new ApiError(401,"Unauthorized request")
     }
     //when user have a token
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user) {
         throw new ApiError(401,"Invalid Access Token")
     }
 
     req.user = user;
     next()
   } catch (error) {
    
    throw new ApiError(401, error?.message || "Invalid Access Token")
   }
})