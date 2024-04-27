import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";



const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))// for storing the files in our local public folder
app.use(cookieParser())


//rotes import 
import userRouter from './routes/user.routes.js'


//routes declaration 
app.use("api/v1/users",userRouter)

export {app}