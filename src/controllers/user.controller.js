import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponce} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) =>{
    // get user details from frontend
    // validation - not empty  
    // check if user already exists : username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from responce
    // check for user creation 
    // return response

   
    // user details taken from user

    const {fullname, email, username, password}=req.body
    console.log("email", email);

    // basic validation

    // if(fullname===""){
    //     throw new ApiError(400, "fullname is required")
    // }

    // advanced validation

    if(
        [fullname, email, username, password].some((field)=>
        field?.trim === "")
    ){
        throw new ApiError(400, "all field is required")
    }

    // finding user already exits or not  
    const existedUser= User.findOne({
        $or:[{username},{email}]
    })

    // cheacking if user already exits 

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    //checking for avatar file 
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is require")
    }

    //upload file on cloudinaty

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    // check avatar because it is require without it database giving error 

    if(!avatar){
        throw new ApiError(400, "avatar file is required")
    }


    //uploading file on database

    const user=await User.create({
        fullname,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // cheaking user and removing password and refresh tokenn

   const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500, "something went wrong while registring the user")
   }


   return res.status(201).json(
    new ApiResponce(200, createdUser, "User registered successfully")
   )

})

export {registerUser}
