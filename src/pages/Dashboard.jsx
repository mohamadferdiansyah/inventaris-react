import React from "react";

export default function Dashboard() {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-lg p-5" style={{ maxWidth: '450px', width: '100%', borderRadius: '16px', border: 'none' }}>
                <div className="card-body">
                    <h3 className="text-center mb-4 fw-bold text-primary">Dashboard</h3>
                    <p className="text-center">Welcome to the dashboard!</p>
                </div>
            </div>
        </div>
    )
}