import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminPage() {
    let user = JSON.parse(localStorage.getItem("user"));

    return (
        user.role === "admin" ? <Outlet /> : <Navigate to="/login" replace/>
    )
}