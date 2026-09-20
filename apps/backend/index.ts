import express from "express";
import {prisma} from "db/client"
import http from "http";
import { boardSchema, issueSchema, organizationsSchema, sectionSchema, SectiontitleUpdateSchema, signinSchema, signupSchema } from "common/types";
import bcrypt from 'bcrypt';
import { JWT_SECRET } from "common-backend/jwt_secret";
import jwt from 'jsonwebtoken';
import { middleware } from "./middleware";
import{setupWebSocketServer} from "../websocket/index"
const app = express();
app.use(express.json());
const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(3000);

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

app.post("/organizations", middleware, async (req, res) => {
  try {
    const parsedData = organizationsSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.json({
        message: "Invalid credentials"
      });
    }

    const { name, description } = parsedData.data;

    const createOrganization = await prisma.organization.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: req.userId,
            role: "OWNER",
          },
        },
      },
    });

    return res.status(201).json({
      message: "Organization created",
      organization: createOrganization,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.get("/organizations",middleware,async(req,res)=>{
try{
  const members = await prisma.membership.findMany({
    where:{
      userId:req.userId
    },
    select:{
      role:true,
      organization:{
        select:{
          name:true
        }
      }
    },
    
  })

    return res.json({
      members
    })

}
catch(e){
  console.log(e);
  return res.json({
    message:"Something went wrong"
  })
}

} )

app.get("/organizations/:id", middleware, async (req, res) => {
  try {
    const orgid = req.params.id;

    
    const organizationcheck = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId: orgid
      }
    });

    if (!organizationcheck) {
      return res.json({
        message: "Access denied or organization not found"
      });
    }

    
    const members = await prisma.membership.findMany({
      where: {
        organizationId: orgid
      },
      include:{
        user:{
          select:{
            email:true,
            username:true
          }
        },
        organization:{
          select:{
            name:true,
            description:true,
          }
        }
      }
    });

    return res.json({
      members: members
    });
  } catch (e) {
    console.log(e);
    return res.json({
      message: "Something went wrong"
    });
  }
});

app.delete("/organizations/:id", middleware,async(req,res)=>{
  try{
  const orgid = req.params.id;
  const orgidcheck = await prisma.membership.findFirst({
    where:{
      userId: req.userId,
      organizationId:orgid,
      role:"OWNER"
    }
  })
  if(!orgidcheck){
    return res.json({
      message:"Something went wrong"
    })
  }

  await prisma.organization.delete({
    where:{
      id:orgid
    }
  })

  return res.json({
    message:"org deleted"
  })

  }
  catch(e){
    console.log(e);
    return res.json({
      message:'Something went wrong'
    })
  }

});

app.post("/organizations/:id/board", middleware,async (req,res)=>{

try{

const parsedData = boardSchema.safeParse(req.body);
  const orgid = req.params.id;
  if(!parsedData.success){
    return res.json(
      {
        message:"Something went wrong"
      }
    )
}
  const {title} = parsedData.data;
  const organizationcheck = await prisma.membership.findFirst({
    where:{
      userId:req.userId,
      organizationId:orgid,
      role:{
        in:["ADMIN" ,"OWNER"]
      }
    }
  })

  if(!organizationcheck){
    return res.json({
      message:"Something went wrong "
    })
  }

  const createBoard = await prisma.board.create({
    data:{
      organizationId:orgid,
      title:title
    }
  })

  return res.json({
    createBoard
  })
  }
  catch(e){
    console.log(e);
    return res.json({
      message:"Something went wrong"
    })
  }
  
});

app.get("/organizations/:id/boards", middleware, async (req,res)=>{

  try{
  const orgid = req.params.id;
  
  const orgCheck = await prisma.membership.findFirst({
    where :{
      userId:req.userId,
      organizationId:orgid
    }
  })

  if(!orgCheck){
    return res.json({
      message:"Something went wrong"
    })
  }
  const boards = await prisma.board.findMany({
    where:{
      organizationId:orgid
    }
  })

  return res.json(boards)

  }
  catch(e){
    console.log(e)
    return res.json({
      message:"Something went wrong "
    });
  }

})

app.get("/organizations/:orgid/boards/:boardid", middleware, async(req,res)=>{
  try{
 const {orgid,boardid } = req.params;

  const orgCheck = await prisma.membership.findFirst({
    where:{
      userId:req.userId,
      organizationId:orgid
    }
  })
  
  if(!orgCheck){
    return res.json({
      message:"Someting went wrong "
    })
  }

  const board = await prisma.board.findFirst({
    where:{
      id:boardid,
      organizationId:orgid
    },
    select:{
      title:true,
      createdAt:true,
      sections:{
        select:{
          title:true,
          position:true,
          issues:{
            select:{
              title:true,
              description:true,
              position:true
            }
          }
        }
      }
    }
  })

  return res.json({
    board
  })
  }
 catch(e){
  console.log(e);
  return res.json({
    message:'Something went wrong'
  })
 }
})

app.delete("/organizations/:orgid/boards/:boardid",middleware, async(req,res)=>{
  try {
    const {orgid,boardid } = req.params;
    
    const orgCheck = await prisma.membership.findFirst({
      where:{
        userId:req.userId,
        organizationId:orgid,
        role:{
          in:["ADMIN","OWNER"]
        }
      }
    })

    if(!orgCheck){
      return res.json({
        message:"Something went wrong"
      })
    }

    const deleted = await prisma.board.deleteMany({
      where: { id: boardid, organizationId: orgid }
    });
    if (deleted.count === 0) {
      return res.status(404).json({ message: "Board not found" });
    }

    return res.json({
      message:'Board deleted'
    })
  } catch (e) {
    console.log(e);
    return res.json({
      message:"Something went wrong"
    })
  }
  
})

app.post("/organizations/:orgid/boards/:boardid/sections", middleware, async(req,res)=>{
  try{
const {orgid, boardid} = req.params
  const parsedData = sectionSchema.safeParse(req.body);
  if(!parsedData.success){
    return res.json({
      message:"Something went wrong"
    })
  }
  const {title} = parsedData.data;
  const idcheck = await prisma.membership.findFirst({
    where:{
      userId:req.userId,
      organizationId:orgid
    }
  })
  if(!idcheck){
    return res.json({message:"Something went wrong"})
  }

  const boardidcheck = await prisma.board.findFirst({
    where:{
      id:boardid,
      organizationId:orgid
    }
  })
  if (!boardidcheck) {
      return res.json({ message: "Something went wrong" });
    }

    const lastSection = await prisma.section.findFirst({
      where: { boardId: boardid },
      orderBy: { position: "desc" },
      select: { position: true }
    });
    const position = lastSection ? lastSection.position + 1 : 1;
    const section = await prisma.section.create({
      data:{
        title,
        boardId:boardid,
        position:position
      }
    })

    return res.json(section)
  }
  catch(e){
    console.log(e);
    return res.json({message:'Error occured'})
  }
})

app.post("/organizations/:orgid/boards/:boardid/sections/:sectionid/issues", middleware,async (req,res)=>{
  try{
const {orgid,boardid,sectionid} = req.params;
  const parsedData = issueSchema.safeParse(req.body);

  if(!parsedData.success){
    return res.json({
      message:"Invalid credentials"
    })
  }
  const {title, description} = parsedData.data;
  const idcheck = await prisma.membership.findFirst({
    where:{
      userId:req.userId,
      organizationId:orgid
    }
  })

  if(!idcheck){
    return res.json({
      message:"Organization doesnt exists"
    })
  }

  const sectioncheck = await prisma.section.findFirst({
    where:{
    id:sectionid,
    boardId:boardid
    }

  }) 
  if(!sectioncheck){
    return res.json({
      message:"Section not found"
    })
  }

  const lastissue = await prisma.issue.findFirst({
    where:{
      sectionId:sectionid
    },
    orderBy:{
      position:"desc"
    },
    select:{
      position:true
    }
  })

  const position = lastissue ? lastissue.position+1 : 1;

    const issue = await prisma.issue.create({
      data: { title, description, boardId: boardid, sectionId: sectionid, position }
    });

    return res.json(issue)
  }
  catch(e){
    return res.json({
      message:"Error occured"
    })
  }
});

app.delete("/organizations/:orgid/boards/:boardid/sections/:sectionid", middleware, async (req, res) => {
  try{
 const {orgid, boardid, sectionid} = req.params;
   const idcheck  = await prisma.membership.findFirst({
    where:{
      userId:req.userId,
      organizationId:orgid,
      role:{in:["ADMIN","OWNER"]}
    }
   })
   if(!idcheck){
    return res.json({
      message:"Org doesnt exist"
    })
   }
  

   const deleted = await prisma.section.deleteMany({
    where:{
      id:sectionid,boardId:boardid
    }
   })

  if (deleted.count === 0) {
      return res.json({ message: "Section not found" });
  }
  return res.json({ message: "Section deleted" });
  }
  catch(e){
    console.log(e);
      return res.json({ message: "Some went wrong" });

  } 
})

app.get("/organizations/:orgid/boards/:boardid/issues/:issueid", middleware, async (req, res) => {
  try {
    const { orgid, boardid, issueid } = req.params;

    const idcheck = await prisma.membership.findFirst({
      where: { userId: req.userId, organizationId: orgid }
    });
    if (!idcheck) {
      return res.json({ message: "Access denied" });
    }

    const issue = await prisma.issue.findFirst({
      where: { id: Number(issueid), boardId: boardid },
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        sectionId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!issue) {
      return res.json({ message: "Issue not found" });
    }

    return res.json(issue);
  }
  catch (e) {
    console.log(e);
    return res.json({ message: "Something went wrong" });
  }
});

app.delete("/organizations/:orgid/boards/:boardid/issues/:issueid", middleware,async (req,res)=>{
  try{
  const {orgid,boardid,issueid} = req.params;

  const orgidcheck = await prisma.membership.findFirst({
    where:{
      userId:req.userId,
      organizationId:orgid
    }
  })

  if(!orgidcheck){
    return res.json({
      message:"Something went wrong "
    })
  }

  const deleted = await prisma.issue.deleteMany({
    where:{
      id:Number(issueid),
      boardId:boardid
    }
  })

  if(deleted.count === 0){
    return res.json({
      message:"Issue not found"
    })
  }

  return res.json({
    message:" Issue deleted "
  })
  }
  catch(e){
    console.log(e)
    return res.json({
      message:"Something went wrong"
    })
  }
})

app.put("/organizations/:orgid/boards/:boardid/sections/:sectionid", middleware, async (req, res) => {
  try {
    const { orgid, boardid, sectionid } = req.params;

    const parsedData = SectiontitleUpdateSchema.safeParse(req.body); 
    if (!parsedData.success) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const { title } = parsedData.data;

    const idcheck = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId: orgid,
        role: { in: ["ADMIN", "OWNER"] }
      }
    });
    if (!idcheck) {
      return res.status(403).json({ message: "Access denied" });
    }

    const sectioncheck = await prisma.section.findFirst({
      where: { id: sectionid, boardId: boardid }
    });
    if (!sectioncheck) {
      return res.status(404).json({ message: "Section not found" });
    }

    const updated = await prisma.section.update({
      where: { id: sectionid },
      data: { title }
    });



    return res.status(200).json(updated);
  }
  catch (e) {
    console.log(e);

    return res.status(500).json({ message: "Something went wrong" });
  }
});