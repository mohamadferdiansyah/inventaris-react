import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/Login";
import Template from "../layouts/Template";
import Profile from "../pages/Profile";
import Dashboard from "../pages/Dashboard";
import PrivatePage from "../pages/middleware/PrivatePage";
import IsLoginPage from "../pages/middleware/IsLoginPage";
import AdminPage from "../pages/middleware/AdminPage";
import StaffPage from "../pages/middleware/StaffPage";
import StuffIndex from "../pages/Stuff";
import InboundIndex from "../pages/Inbound";
import LendingIndex from "../pages/Lending/Index";
import LendingData from "../pages/Lending/data";
import AdminDashboard from "../pages/Admin/Dashboard";
import StaffDashboard from "../pages/Staff/Dashboard";

export const router = createBrowserRouter([
    { 
        path: "/",
        element: <Template />,
        children: [
            { path: "/", element: <App /> },
            { 
                path: "/login", 
                element: <IsLoginPage />, 
                children: [
                    { path: "", element: <Login /> },
                ]
            },
            { 
                path: "", 
                element: <PrivatePage />, 
                children: [
                    { 
                        path: "/profile",
                        element: <Profile /> 
                    },
                    {
                        path: "/admin",
                        element: <AdminPage />,
                        children: [
                            { 
                                path: "dashboard", 
                                element: <AdminDashboard />
                            },
                            { 
                                path: "stuffs", 
                                element: <StuffIndex /> 
                            },
                            { 
                                path: "inbounds", 
                                element: <InboundIndex /> 
                            },
                        ]
                    },
                    {
                        path: "/staff",
                        element: <StaffPage />,
                        children: [
                            { 
                                path: "dashboard", 
                                element: <StaffDashboard />
                            },
                            {
                                path: "lendings",
                                element: <LendingIndex />
                            },
                            {
                                path: "lendings-data",
                                element: <LendingData />
                            }
                        ]
                    }
                ]
            }
        ]
    }
])  