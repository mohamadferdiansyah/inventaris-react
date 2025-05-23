import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function PrivatePage() {
    let authentication = localStorage.getItem("access_token");

    return authentication ? <Outlet /> : <Navigate to="/login" replace/>
}