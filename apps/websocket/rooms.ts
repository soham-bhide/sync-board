import { WebSocket } from "ws";
interface User {
    userId: string;
    username: string;
    ws: WebSocket;
}

interface Room {
    boardId: string;
    users: User[];
}

const boardRooms: Room[] = [];

export function findroom(boardId: string): Room | undefined {
    return boardRooms.find(
        (room) => room.boardId === boardId
    );
}

export function joinroom(
    boardId: string,
    userId: string,
    username: string,
    ws: WebSocket
): void {

    let room = findroom(boardId);

    if (!room) {
        room = {
            boardId,
            users: []
        };

        boardRooms.push(room);
    }

    room.users = room.users.filter(
        (u) => u.userId !== userId
    );

    room.users.push({
        userId,
        username,
        ws
    });
}

export function leaveroom(
    boardId: string,
    userId: string
): void {

    const room = findroom(boardId);

    if (!room) return;

    room.users = room.users.filter(
        (u) => u.userId !== userId
    );

    if (room.users.length === 0) {

        const index = boardRooms.findIndex(
            (r) => r.boardId === boardId
        );

        if (index !== -1) {
            boardRooms.splice(index, 1);
        }
    }
}

export function broadcasttoroom(boardId:string,data:unknown,excludedUserId?:string):void{
    const room = findroom(boardId);
    if(!room){
        return 
    }
    const payload = JSON.stringify(data);

    for(let i=0;i<room.users.length;i++){
        const user = room.users[i];
        if(user?.userId === excludedUserId){
            continue
        }

        if(user?.ws.readyState ===user?.ws.OPEN){
            user?.ws.send(payload);
        }
    }
}

export function broadcastpresence(boardId: string): void {
  const room = findroom(boardId);

  if (!room) {
    return;
  }  
  const userList = room.users.map((user: User) => ({
    userId: user.userId,
    username: user.username
  }));

  broadcasttoroom(boardId, { type: "presence_update", users: userList });
}
