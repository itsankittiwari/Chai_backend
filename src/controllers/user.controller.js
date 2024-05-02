import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.moel.js";


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return {
      accessToken,
      refreshToken
    }

  }
  catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}


const registerUser = asyncHandler(async (req, res) => {
  // gets user details from frontend 
  // validation  _ not empty
  // check if user already exists: username, email
  // check for images , check for avatar 
  // upload them to cloudinary , avatar 
  // create user object  - create entry in db 
  // remove password and refresh token field from response 
  // check for user creation 
  // return res  

  const { fullName, email, username, password } = req.body;

  // check the validation by using if condition with extra features   
  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required ");
  }

  // check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //multer gives the file access like express give us req.body 
  const avatarFile = req.files?.avatar;
  const coverImageFile = req.files?.coverImage;

  // check for images , check for avatar 
  if (!avatarFile || !avatarFile[0]?.path) {
    throw new ApiError(400, "Avatar file is required");
  }

  // upload avatar to cloudinary
  const avatar = await uploadOnCloudinary(avatarFile[0].path);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  // upload cover image to cloudinary if exists
  let coverImage = "";
  if (coverImageFile && coverImageFile[0]?.path) {
    coverImage = await uploadOnCloudinary(coverImageFile[0].path);
    if (!coverImage) {
      throw new ApiError(500, "Failed to upload cover image");
    }
  }

  // create user object  - create entry in db 
  const newUser = new User({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "", // If coverImage exists, use its URL, otherwise use empty string
    email,
    password,
    username: username.toLowerCase()
  });

  const user = await newUser.save();

  // remove password and refresh token field from response 
  const { password: _, refreshToken: __, ...createdUser } = user.toObject();

  // return response  
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully")
  );
});


const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  //username or eamil
  //find the user
  //password check
  //access and refrence token
  //send cookie

  const { email, username, password } = req.body
  if (!username || !email) {
    throw new ApiError(400, "username or password is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]  //$or is inbuilt function to find one betwwen two fields and these types of function are given in mongoose  
  })

  if (!user) {
    throw new ApiError(404, "user does'nt exists")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const {accessToken,refreshToken} =  await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("password -refreshToken")

  const option ={
    httpOnly: true,
    secure: true
  }

  return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",options).json(
    new ApiResponse(
      200,{
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged In Successfully"
    )
  )

})


const logoutUser = asyncHandler(async (req,res) =>{

})
export {
  registerUser,
  loginUser,
  logoutUser
};
