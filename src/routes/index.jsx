import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/Login";
import Template from "../layouts/Template";
import Profile from "../pages/Profile";
import Dashboard from "../pages/Dashboard";
// import Home from "../pages/Home";

export const router = createBrowserRouter([
    { 
        path: "/",
        element: <Template />,
        children: [
            { path: "/", element: <App /> },
            { path: "/login", element: <Login /> },
            { path: "/profile", element: <Profile /> },
            { path: "/dashboard", element: <Dashboard /> }
        ]
    }
])