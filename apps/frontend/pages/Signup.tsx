import {Button} from "../components/Button"
import { use, useState } from "react"
import axios from "axios";
import { useNavigate } from "react-router-dom";
export function Signup(){
    const navigate = useNavigate();
    const [username,setUsername] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [error, setError] = useState("");
    interface User{
        username:string,
        email:string,
        passwor:string
    }
    const handleSubmit= async ()=>{
    if (!username || !email || !password) {
        setError("Please fill in all fields");
        return;
  }
        setError ("")
        try{
            await axios.post<User[]>("http://localhost:3001/signup",{
                username, email, password
            });
            navigate("/signin")
        }catch(e){
            setError("Something went wrong")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="w-full max-w-sm  bg-zinc-900 rounded-xl p border-none">
            <h1 className="text-xl font-semibold font mb-6 text-white flex items-center justify-center">
                Create Account
            </h1>
            <div className="flex flex-col gap-4">
            <input type="text" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} className="rounded-lg px-4 py-2 text-white focus-visible:outline-2 outline-white flex text-center placeholder:opacity-50 " />
            <input type="abc@gmail.com" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="rounded-lg px-4 py-2 text-white focus-visible:outline-2 outline-white text-center placeholder:opacity-50 " />    
            <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded-lg px-4 py-2 text-white focus-visible:outline-2 outline-white  text-center placeholder:opacity-50" />
            <Button onClick={handleSubmit} children="Signup"></Button>
            </div>
            </div>
        </div>
    )
}