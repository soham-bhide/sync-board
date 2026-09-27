import {Signup} from "../pages/Signup"
import {Signin} from "../pages/Signin"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup></Signup>}></Route>
          <Route path="/signin" element={<Signin></Signin>} />
        </Routes>
      </BrowserRouter>
  )
}

export default App;
