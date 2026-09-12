import {z} from 'zod';

export const signupSchema = z.object({
    username: z.string().min(1).max(20),
    email: z.email(),
    password:z.string().min(5).max(50)
})

export const signinSchema = z.object({
    email: z.email(),
    password:z.string().min(5).max(50)
})
