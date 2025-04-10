import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
    let navigate = useNavigate();

    const isLoggedIn = !!localStorage.getItem("access_token");

    function logoutHandler() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    return (
        <nav className="navbar navbar-expand-lg">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">
                    My Inventory
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNavAltMarkup"
                    aria-controls="navbarNavAltMarkup"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon" />
                </button>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav">
                        {!isLoggedIn && (
                            <Link className="nav-link" to="/login">
                                Login
                            </Link>
                        )}
                        {isLoggedIn && (
                            <>
                                <Link className="nav-link" to="/dashboard">
                                    Dashboard
                                </Link>
                                <Link className="nav-link" to="/profile">
                                    Profile
                                </Link>
                                <a
                                    className="nav-link"
                                    style={{ cursor: "pointer" }}
                                    onClick={logoutHandler}
                                >
                                    Logout
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}