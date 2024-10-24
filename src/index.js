// require('dotenv).config({path:'./env'});
import dotenv from "dotenv";

import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running at PORT :- ${process.env.PORT}`);
    })

    app.on("error" ,(error)=>{
        console.log("ERR" ,error);
        throw error
    })
})
.catch((error)=>{
    console.log(" MONGODB connection FAILED : -ERROR : -" , error);
    
})














//This is a first approche;
 /* import express from "express";
const app=express();
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("Error",(error)=>{
            console.log("ERROR" ,error);
            throw error
        })

        app.listen(process.env.PORT ,()=>{
            console.log(`App is listen at PORT : - ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.log("Error",error);
        
    }
})()   */