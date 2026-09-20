import {WebSocketServer, WebSocket} from "ws";
import {prisma} from "db/client";
import { joinroom,leaveroom,broadcastpresence,broadcasttoroom } from "./rooms";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "common-backend/jwt_secret";
interface JwtPayload {
  userId: string;
}

export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: WebSocket, req) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "Unauthorized");
      return;
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      ws.close(4001, "Unauthorized");
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { username: true }
    });

    if (!dbUser) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const userId = payload.userId;
    const username = dbUser.username;
    let currentBoardId: string | null = null;

    ws.on("message", async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "join_board") {
        const orgId: string = msg.orgId;
        const boardId: string = msg.boardId;

        const membership = await prisma.membership.findFirst({
          where: { userId: userId, organizationId: orgId }
        });

        const boardBelongsToOrg = await prisma.board.findFirst({
          where: { id: boardId, organizationId: orgId }
        });

        if (!membership || !boardBelongsToOrg) {
          ws.send(JSON.stringify({ type: "error", message: "Access denied" }));
          return;
        }

        currentBoardId = boardId;
        joinroom(boardId, userId, username,ws);
      }

      if (msg.type === "leave_board") {
        if (currentBoardId !== null) {
          leaveroom(currentBoardId, userId);
          currentBoardId = null;
        }
      }
    });

    ws.on("close", () => {
      if (currentBoardId !== null) {
        leaveroom(currentBoardId, userId);
      }
    });
  });

  return wss;
}

