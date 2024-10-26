import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOneCloudinary } from "../utils/cloudnary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens=async(userId)=>{
  try {
    const user =await User.findById(userId);
    const accessToken=user.generateAccessToken();
    const refereshToken=user.generateRefreshToken();

    user.refereshToken=refereshToken
    await user.save({validateBeforeSave:false});

    return {refereshToken , accessToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong while genrating refrsh and access token");
  }
}

//Register a user
const registerUser = asyncHandler(async (req, res) => {
  //  res.status(200).json({
  //     message: 'I LOVE YOU PAWAN'
  // })

  //get user details from frontend
  // validation - not empty
  //check if user already exists - username , email
  //check for images check for avtar
  //upload them to cloudnary
  //create user object - cerate enter in db
  //remove password and refresh token field from response
  // check for user creation
  //return res


  const { username, email, fullName, password } = req.body
  console.log("email :", email);
  // console.log(req.body);
  

  //   if(fullName===""){
  //     throw new ApiError(400,"Fullname is required");
  //   }

  if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existUser) {
    throw new ApiError(409, "User with email or username already exists...");
  }
// console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required ");
  }

  const avatar = await uploadOneCloudinary(avatarLocalPath);
  const coverImages = await uploadOneCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required ");

  }
  const user = await User.create({
     fullName,
    avatar: avatar.url,
    coverImage: coverImages?.url || "",
    email,
    password,
    username: username.toLowerCase()
  }) 

  const createdUser = await User.findById(user._id).select( "-password -refereshToken " )

  if(!createdUser){
    throw new Error(500,"Something went wrong when registring th user");
    
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser , "User Registered Successfully")
  )
})

//Login a user
const loginUser=asyncHandler(async(req,res)=>{

  //req bodt -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookies
  //send res


  const {username,email,password}=req.body

  if(!(username || email)){
    throw new ApiError(400,"username or password is requried");
  }

  const user =await User.findOne({ $or:[{username},{email}]} )

  if(!user){
    throw new ApiError(404,"User does not exits");
  }

 const isPasswordValid = await user.isPasswordCorrect(password);
 if(!isPasswordValid){
  throw new ApiError(401,"Invalid user credentials");
 }

const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id);

const loggeInUser=await User.findById(user._id).select(" -password -refreshToken ")

const options = {
  httpOnly:true,
  secure:true
}
return res
.status(200)
.cookie("accessToken" , accessToken ,options)
.cookie("refereshToken" , refreshToken ,options)
.json(
  new ApiResponse(200,{
    loggeInUser,accessToken,refreshToken
  }, 
  "User logged in Successfully"
)
)
})

//logout user

const logOutUser =asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
      $unset:{
        refereshToken:undefined
      }
    },{
      new :true
    }
  )

  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refereshToken",options)
  .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken =asyncHandler(async(req,res)=>{
const incomingRefreshToken=req.cookies.refereshToken || req.body.refereshToken

if(!incomingRefreshToken){
  throw new ApiError(401,"unauthorizes request");
}
try {
  const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
  const user =await User.findById(decodedToken?._id);
  if(!user){
    throw new ApiError(401,"Invalid refresh token");
  }
  
  if(incomingRefreshToken !== user?.refereshToken){
    throw new ApiError(401,"Expire or used refresh token");
  }
  
  const options={
    httpOnly:true,
    secure:true
  }
  const {accessToken,refereshToken}=await generateAccessAndRefreshTokens(user._id)
  
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refereshToken,options)
  .json(
    new ApiResponse(200,{accessToken,refereshToken},"accessToken Refresh successfully")
  )
} catch (error) {
  throw new ApiError(401,"Invalid refresh token");
  
}
})

 
export { registerUser ,loginUser ,logOutUser ,refreshAccessToken}