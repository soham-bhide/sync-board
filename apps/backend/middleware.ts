import jwt from "jsonwebtoken";
import { JWT_SECRET } from "common-backend/jwt_secret";
export function middleware(req:any,res:any,next:any){
    const authHeader = req.headers.authorizations;
     if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;   
    next();                          
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
