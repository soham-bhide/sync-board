import {WebSocketServer} from "ws";
import {prisma} from "db/client"
const wss = new WebSocketServer({ port: 8080 });