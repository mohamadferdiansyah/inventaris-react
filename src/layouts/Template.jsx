import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function Template() {
    return (
        <>
            <Navbar></ Navbar>
            <div className="container bg-gradient" style={{ background: 'linear-gradient(135deg, #74EBD5 0%, #9FACE6 100%)'}}>
                <Outlet />
            </div>
        </>
    )
}