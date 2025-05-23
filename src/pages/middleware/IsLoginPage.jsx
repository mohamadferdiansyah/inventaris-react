import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function IsLoginPage() {
    let authentication = localStorage.getItem("access_token");
    let role = JSON.parse(localStorage.getItem("user"))?.role;

    return !authentication ? <Outlet /> : <Navigate to={role === "admin" ? "/admin/dashboard" : role === "staff" ? "/staff/dashboard" : "/staff/dashboard"} replace/>
}