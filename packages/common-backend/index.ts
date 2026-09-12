import jwt from "jsonwebtoken";
export const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-env";