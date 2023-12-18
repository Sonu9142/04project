import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponce} from "../utils/ApiResponse.js"

const generateAccessTokenAndRefereshTokens = async(userId)=>{
    try {
        const user=await User.findById()
       const accessToken= user.generateAccessToken()
       const refreshToken= user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({validateBeforeSave: false})

       return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generation refresh and access token")
    }
}

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
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    // cheacking if user already exits 

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    console.log(req.files)

    //checking for avatar file 
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.
        coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath=req.files.coverImage[0].path
    } 

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

const loginUser= asyncHandler(async(req,res)=>{
    //req body =>data
    //username or email
    //find the user
    //password cheak
    //access and refresh token
    //send cookie

    const {email,username,password}=req.body
    if(!username || !email){
        throw new ApiError(400,"username or email is required")
    }

  const user= await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user doesn't exits")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "password is incorrect")
    }

    const {accessToken, refreshToken} =await
    generateAccessTokenAndRefereshTokens(user._id)

    const loggedInUser=await user.findById(user._id)
    select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponce(
            200,
            {user:loggedInUser, accessToken, refreshToken}
        ), "user logged In successfully"
    )


})

const logoutUser= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponce(200, {},"user logedout succefully"))
})
export {
    registerUser,
    loginUser,
    logoutUser
}
