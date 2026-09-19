import {WebSocketServer} from "ws";
import {prisma} from "db/client";

const wss = new WebSocketServer({ port: 3001 });

interface User{
userId:string,
username:string,
ws: WebSocket
};

interface Room {
    boardId:string,
    users:User[]
}
const boardRooms:Room[] = [];

function findroom(boardId:string):Room|undefined{
return boardRooms.find((room)=>{room.boardId ===boardId});
}

function joinroom(boardId:string,userId:string,username:string,ws:WebSocket):void{
    let room = findroom(boardId);
    if(!room){
        room = {boardId, users:[]}
         boardRooms.push(room)
    }

    room.users = room.users.filter((u)=>{u.userId !== userId});
    room.users.push({userId,username,ws});
    broadcastPresence(boardId);
}

function leaveroom(boardId:string,userId:string): void{
    let room = findroom(boardId);
    if(!room) return;
    room.users = room.users.filter((u)=>{u.userId !== userId});
    if(room.users.length ===0){
        const index = boardRooms.findIndex((r)=>r.boardId ===boardId)
        if(index ==-1){
            boardRooms.splice(index,1)
        }
    }
    else{
        broadcastPresence(boardId)
    }
}
wss.on("connection", (socket)=>{
    
})