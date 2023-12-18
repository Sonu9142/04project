import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";


export const verifyJWT= asyncHandler(async(req,res,next)=>{
    try {
        const token= req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Beared ","")
    
        if(token){
            throw new ApiError(401, "unauthorized request")
        }
    
       const decodedToken= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
       const user=await User.findById(decodedToken?._id).select
       ("-password -refreshToken")
    
       if(!user){
        //todo : discuss about frontend
        throw new ApiError(401, "invalid access token")
       }
    
       req.user=user;
       next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid valid token access")
    }
})