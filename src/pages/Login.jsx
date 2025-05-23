"use client"

import axios from "axios"
import React from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {
    // state : menyimpan data di project react
    // login : nama datanya, setLogin
    const [login, setLogin] = React.useState({
        username: "",
        password: "",
    })

    const [err, setError] = React.useState([])

    const navigate = useNavigate()

    function loginProcess(e) {
        e.preventDefault() //mengambil alih fungsi
        axios
            .post("http://45.64.100.26:88/API-Lumen/public/login", login)
            .then((res) => {
                console.log(res)
                localStorage.setItem("access_token", res.data.data.access_token)
                localStorage.setItem("user", JSON.stringify(res.data.data.user))
                if (res.data.data.user.role === "admin") {
                    navigate("/admin/dashboard", { replace: true })
                } else if (res.data.data.user.role === "staff") {
                    navigate("/staff/dashboard", { replace: true })
                }
            })
            .catch((err) => {
                setError(err.response.data)
            })
    }

    return (
        <div
            className="min-vh-100 d-flex justify-content-center align-items-center bg-light"
            style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)" }}
        >
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6 col-xl-5">
                        <div className="card border-0 shadow-lg" style={{ borderRadius: "16px" }}>
                            <div className="card-body p-5">
                                {/* Header with logo */}
                                <div className="text-center mb-4">
                                    <div
                                        className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: "70px", height: "70px" }}
                                    >
                                        <span className="fs-3">📦</span>
                                    </div>
                                    <h2 className="fw-bold">Welcome Back</h2>
                                    <p className="text-muted">Sign in to continue to Inventory System</p>
                                </div>

                                {/* Error alert */}
                                {Object.keys(err).length > 0 ? (
                                    <div className="alert alert-danger" role="alert">
                                        {err.message}
                                    </div>
                                ) : null}

                                {/* Login form */}
                                <form onSubmit={(e) => loginProcess(e)}>
                                    <div className="mb-4">
                                        <label htmlFor="username" className="form-label fw-semibold">
                                            Email
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <span>✉️</span>
                                            </span>
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                className="form-control border-start-0 ps-0"
                                                placeholder="Enter your email"
                                                onChange={(e) => setLogin({ ...login, username: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label htmlFor="password" className="form-label fw-semibold mb-0">
                                                Password
                                            </label>
                                            <a href="#" className="text-decoration-none small">
                                                Forgot password?
                                            </a>
                                        </div>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <span>🔒</span>
                                            </span>
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                className="form-control border-start-0 ps-0"
                                                placeholder="Enter your password"
                                                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100 py-2 mt-3 fw-semibold">
                                        Sign In
                                    </button>

                                    <div className="text-center mt-4">
                                        <span className="text-muted">Don't have an account? </span>
                                        <a href="#" className="text-decoration-none fw-semibold">
                                            Sign Up
                                        </a>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-4">
                            <p className="text-muted small mb-0">
                                &copy; {new Date().getFullYear()} Inventory System. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
