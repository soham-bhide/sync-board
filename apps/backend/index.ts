import express from "express";
import {prisma} from "db/client"
import { signinSchema, signupSchema } from "common/types";
import bcrypt from 'bcrypt';
import { JWT_SECRET } from "common-backend/jwt_secret";
import jwt from 'jsonwebtoken';
const app = express();

app.use(express.json());

app.post("/signup",async (req,res)=>{
    try{
const parsedData = signupSchema.safeParse(req.body);
 if(!parsedData.success){
    return res.json({
        message:"Invalid Credentials"
    })
 }
 const {username,email,password} = parsedData.data;
  const usercheck = await prisma.user.findUnique(
    {
        where:{email}
    }
  )
  if(usercheck){
    return res.json({
        message:"User already exists"
    })
  }
  const hashedpassword =await  bcrypt.hash(password,10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedpassword,
      },
    });
  return res.json({
    message:"User Signed up"
  })
    }
    catch(e){
        console.log(e);
        return res.json({
            error:"Error occured while signup"
        })
    }
 
});


app.post("/signin", async (req,res)=>{
try{
const parsedData = signinSchema.safeParse(req.body);
if(!parsedData.success){
    return res.json({
        message:"Invalid Credentials"
    })
}

 const {email,password} = parsedData.data;
 const usercheck = await prisma.user.findUnique({
    where:{
        email
    }
 })
 if(!usercheck){
    return res.json({
        message:"Invalid email or password"
    })
 }
 const passwordcheck = await bcrypt.compare(password,usercheck.password)
 if(!passwordcheck){
    return res.json({
        message:"Invalid email or password"
    })
 }
 const token = jwt.sign({userId:usercheck.id},JWT_SECRET )

 return res.json({
    message:"Signed in successfully",
    token
 })
}
catch(e){
    return res.json({
        message:"Something went wrong"
    })
}

})
