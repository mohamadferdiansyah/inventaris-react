"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"

export default function EnhancedNavbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [expanded, setExpanded] = useState(false)

    const isLoggedIn = !!localStorage.getItem("access_token")
    const user = JSON.parse(localStorage.getItem("user") || '{"name": "User"}')

    // Close navbar when route changes (mobile)
    useEffect(() => {
        setExpanded(false)
    }, [location.pathname])

    function logoutHandler() {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        navigate("/login", { replace: true })
    }

    // Check if the link is active
    const isActive = (path) => {
        return location.pathname === path ? "active" : ""
    }

    return (
        <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom shadow-sm my-2 rounded-5">
            <div className="container-fluid px-3 px-md-4">
                {/* Brand/logo */}
                <Link className="navbar-brand d-flex align-items-center" to="/">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                        <span className="fs-5">📦</span>
                    </div>
                    <span className="fw-bold">Inventory System</span>
                </Link>

                {/* Mobile toggle button */}
                <button
                    className="navbar-toggler border-0"
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    aria-controls="navbarContent"
                    aria-expanded={expanded}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar content */}
                <div className={`collapse navbar-collapse ${expanded ? "show" : ""}`} id="navbarContent">
                    {isLoggedIn ? (
                        <>
                            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                                <li className="nav-item">
                                    <Link className={`nav-link px-3 ${isActive("/dashboard")}`} to={user.role === "admin" ? "admin/dashboard" : user.role === "staff" ? "staff/dashboard" : "staff/dashboard"} >
                                        <span className="me-2">📊</span>
                                        Dashboard
                                    </Link>
                                </li>
                                {user.role === "admin" && (
                                    <>
                                        <li className="nav-item">
                                            <Link className={`nav-link px-3 ${isActive("/admin/stuffs")}`} to="/admin/stuffs">
                                                <span className="me-2">📦</span>
                                                Inventaris
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link className={`nav-link px-3 ${isActive("/admin/inbounds")}`} to="/admin/inbounds">
                                                <span className="me-2">📝</span>
                                                Laporan
                                            </Link>
                                        </li>
                                    </>
                                )}
                                {user.role === "staff" && (
                                    <>
                                    <li className="nav-item">
                                        <Link className={`nav-link px-3 ${isActive("/staff/lendings")}`} to="/staff/lendings">
                                            <span className="me-2">🔄</span>
                                            Peminjaman
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className={`nav-link px-3 ${isActive("/staff/lendings-data")}`} to="/staff/lendings-data">
                                            <span className="me-2">🔄</span>
                                            Peminjaman Data
                                        </Link>
                                    </li>
                                    </>
                                )}
                            </ul>

                            {/* User menu */}
                            <div className="d-flex align-items-center">
                                {/* Notifications */}
                                <div className="dropdown me-3 d-none d-lg-block">
                                    <button
                                        className="btn btn-link text-dark position-relative p-1"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <span className="fs-5">🔔</span>
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                            2
                                        </span>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ minWidth: "300px" }}>
                                        <li>
                                            <h6 className="dropdown-header">Notifikasi</h6>
                                        </li>
                                        <li>
                                            <a className="dropdown-item py-2" href="#">
                                                <div className="d-flex w-100 justify-content-between">
                                                    <h6 className="mb-1">Stok Rendah</h6>
                                                    <small className="text-muted">3 jam yang lalu</small>
                                                </div>
                                                <p className="mb-1 small">Laptop tersisa 5 unit</p>
                                            </a>
                                        </li>
                                        <li>
                                            <hr className="dropdown-divider" />
                                        </li>
                                        <li>
                                            <a className="dropdown-item py-2" href="#">
                                                <div className="d-flex w-100 justify-content-between">
                                                    <h6 className="mb-1">Peminjaman Baru</h6>
                                                    <small className="text-muted">1 hari yang lalu</small>
                                                </div>
                                                <p className="mb-1 small">John Doe meminjam 2 item</p>
                                            </a>
                                        </li>
                                        <li>
                                            <hr className="dropdown-divider" />
                                        </li>
                                        <li>
                                            <a className="dropdown-item text-center" href="#">
                                                Lihat Semua Notifikasi
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                {/* User dropdown */}
                                <div className="dropdown">
                                    <button
                                        className="btn btn-link text-dark text-decoration-none dropdown-toggle d-flex align-items-center"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <div
                                            className="bg-primary bg-opacity-10 rounded-circle me-2 d-flex align-items-center justify-content-center"
                                            style={{ width: "32px", height: "32px" }}
                                        >
                                            <span className="fw-bold">{user.username.charAt(0)}</span>
                                        </div>
                                        <span className="d-none d-lg-inline">{user.name}</span>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                        <li>
                                            <div className="dropdown-item-text">
                                                <div className="fw-bold">{user.name}</div>
                                                <div className="small text-muted">{user.email || "admin@example.com"}</div>
                                            </div>
                                        </li>
                                        <li>
                                            <hr className="dropdown-divider" />
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/profile">
                                                <span className="me-2">👤</span> Profil
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/settings">
                                                <span className="me-2">⚙️</span> Pengaturan
                                            </Link>
                                        </li>
                                        <li>
                                            <hr className="dropdown-divider" />
                                        </li>
                                        <li>
                                            <button className="dropdown-item text-danger" onClick={logoutHandler}>
                                                <span className="me-2">🚪</span> Keluar
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="ms-auto">
                            <Link to="/login" className="btn btn-primary me-2">
                                Masuk
                            </Link>
                            <Link to="/register" className="btn btn-outline-secondary d-none d-lg-inline-block">
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
