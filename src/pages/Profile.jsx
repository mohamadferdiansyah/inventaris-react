import "bootstrap/dist/css/bootstrap.min.css"
import { useEffect, useState } from "react"

export default function InventoryProfilePage() {
  // Sample pengguna data for inventory system
  const pengguna = {
    penggunaname: "John Doe",
    email: "john.doe@company.com",
    role: "Inventory Manager",
    department: "Warehouse Operations",
    location: "Jakarta, Indonesia",
    avatar: "/placeholder.svg?height=128&width=128",
    status: "online", // Can be: online, away, offline
    joinDate: "January 2020",
    phone: "+62 123 456 7890",
    employeeId: "EMP-2023-0042",
  }

  const [user, setUser] = useState([]);

  useEffect(() => {
    // Ambil data pengguna dari localStorage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  // Status styling based on pengguna status
  const getStatusStyle = (status) => {
    switch (status) {
      case 1:
        return {
          color: "#198754", // Bootstrap success color
          bgColor: "rgba(25, 135, 84, 0.1)",
          label: "Online",
        }
      case 2:
        return {
          color: "#fd7e14", // Bootstrap warning color
          bgColor: "rgba(253, 126, 20, 0.1)",
          label: "Away",
        }
      case 3:
      default:
        return {
          color: "#6c757d", // Bootstrap secondary color
          bgColor: "rgba(108, 117, 125, 0.1)",
          label: "Offline",
        }
    }
  }

  const statusStyle = getStatusStyle(user.status)

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Profile Sidebar */}
        <div className="col-md-4">
          {/* Profile Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="mb-0 text-center">User Profile</h5>
            </div>
            <div className="card-body text-center p-4">
              <div className="position-relative mx-auto mb-4" style={{ width: "128px", height: "128px" }}>
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHDRlp-KGr_M94k_oor4Odjn2UzbAS7n1YoA&s"
                  alt="Profile picture"
                  className="rounded-circle img-thumbnail object-fit-cover border-4 w-100 h-100"
                />
                {/* Status indicator */}
                <div
                  className="position-absolute bottom-0 end-0 rounded-circle border border-white border-2"
                  style={{
                    width: "25px",
                    height: "25px",
                    backgroundColor: statusStyle.color,
                  }}
                ></div>
              </div>

              <h2 className="fs-3 fw-bold">{user.username}</h2>
              <p className="text-muted mb-2">{user.email}</p>
              <p className="text-muted mb-2">{user.role}</p>
              <p className="badge bg-secondary mb-2">{user.id}</p>

              {/* Status badge */}
              <div className="mb-3">
                <span
                  className="badge rounded-pill px-3 py-2"
                  style={{
                    backgroundColor: statusStyle.bgColor,
                    color: statusStyle.color,
                  }}
                >
                  <span className="me-1">●</span>
                  {statusStyle.label}
                </span>
              </div>

              <div className="d-flex align-items-center justify-content-center gap-2 text-muted mb-3">
                <span>📍</span>
                <span>{pengguna.location}</span>
              </div>

              <div className="d-grid gap-2 mt-4">
                <button className="btn btn-primary">Edit Profile</button>
                <button className="btn btn-outline-secondary">View Permissions</button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Contact Information</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <span>✉️</span>
                <span>{pengguna.email}</span>
              </div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <span>📞</span>
                <span>{pengguna.phone}</span>
              </div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <span>🏢</span>
                <span>{pengguna.department}</span>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span>📅</span>
                <span>Joined {pengguna.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Inventory Access */}
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Inventory Access</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-success">View Items</span>
                <span className="badge bg-success">Add Items</span>
                <span className="badge bg-success">Edit Items</span>
                <span className="badge bg-success">Generate Reports</span>
                <span className="badge bg-success">Manage Categories</span>
                <span className="badge bg-warning">Delete Items</span>
                <span className="badge bg-danger">Admin Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-8">
          {/* Inventory Overview */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Inventory Overview</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card bg-primary bg-opacity-10 border-0 h-100">
                    <div className="card-body text-center">
                      <h3 className="display-4 fw-bold text-primary">247</h3>
                      <p className="mb-0">Total Items</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-success bg-opacity-10 border-0 h-100">
                    <div className="card-body text-center">
                      <h3 className="display-4 fw-bold text-success">18</h3>
                      <p className="mb-0">Categories</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-warning bg-opacity-10 border-0 h-100">
                    <div className="card-body text-center">
                      <h3 className="display-4 fw-bold text-warning">12</h3>
                      <p className="mb-0">Low Stock</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Managed Inventory Categories */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Managed Inventory Categories</h5>
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Sort by
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#">
                      Item Count
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Name (A-Z)
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Last Updated
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">Office Equipment</h5>
                        <span className="badge bg-success">78 Items</span>
                      </div>
                      <p className="card-text text-muted small">
                        Computers, printers, phones, and other office equipment.
                      </p>
                      <div className="mt-3 mb-3">
                        <span className="badge bg-light text-dark me-2">Computers</span>
                        <span className="badge bg-light text-dark me-2">Printers</span>
                        <span className="badge bg-light text-dark">Phones</span>
                      </div>
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: "85%" }}
                          aria-valuenow="85"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-muted">Stock Level</small>
                        <small className="text-muted">85%</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">Furniture</h5>
                        <span className="badge bg-success">64 Items</span>
                      </div>
                      <p className="card-text text-muted small">Desks, chairs, cabinets, and other office furniture.</p>
                      <div className="mt-3 mb-3">
                        <span className="badge bg-light text-dark me-2">Desks</span>
                        <span className="badge bg-light text-dark me-2">Chairs</span>
                        <span className="badge bg-light text-dark">Cabinets</span>
                      </div>
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: "92%" }}
                          aria-valuenow="92"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-muted">Stock Level</small>
                        <small className="text-muted">92%</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">Office Supplies</h5>
                        <span className="badge bg-warning">42 Items</span>
                      </div>
                      <p className="card-text text-muted small">
                        Paper, pens, staplers, and other consumable office supplies.
                      </p>
                      <div className="mt-3 mb-3">
                        <span className="badge bg-light text-dark me-2">Paper</span>
                        <span className="badge bg-light text-dark me-2">Pens</span>
                        <span className="badge bg-light text-dark">Staplers</span>
                      </div>
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-warning"
                          role="progressbar"
                          style={{ width: "45%" }}
                          aria-valuenow="45"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-muted">Stock Level</small>
                        <small className="text-muted">45%</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">IT Equipment</h5>
                        <span className="badge bg-danger">12 Items</span>
                      </div>
                      <p className="card-text text-muted small">
                        Servers, network equipment, and other IT infrastructure.
                      </p>
                      <div className="mt-3 mb-3">
                        <span className="badge bg-light text-dark me-2">Servers</span>
                        <span className="badge bg-light text-dark me-2">Routers</span>
                        <span className="badge bg-light text-dark">Switches</span>
                      </div>
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-danger"
                          role="progressbar"
                          style={{ width: "25%" }}
                          aria-valuenow="25"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-muted">Stock Level</small>
                        <small className="text-muted">25%</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer bg-white text-center">
              <button className="btn btn-primary">Add New Category</button>
            </div>
          </div>

          {/* Recent Inventory Activity */}
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Recent Inventory Activity</h5>
              <p className="card-text text-muted small mb-0">Latest inventory transactions and updates</p>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex gap-3">
                  <span className="fs-5 text-success mt-1">📥</span>
                  <div>
                    <p className="fw-medium mb-0">Added 15 new laptops to Office Equipment</p>
                    <p className="text-muted small">Today at 10:45 AM</p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex gap-3">
                  <span className="fs-5 text-warning mt-1">🔄</span>
                  <div>
                    <p className="fw-medium mb-0">Updated stock levels for Office Supplies</p>
                    <p className="text-muted small">Yesterday at 3:30 PM</p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex gap-3">
                  <span className="fs-5 text-danger mt-1">📤</span>
                  <div>
                    <p className="fw-medium mb-0">Removed 3 damaged chairs from Furniture</p>
                    <p className="text-muted small">2 days ago</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="d-flex gap-3">
                  <span className="fs-5 text-primary mt-1">📋</span>
                  <div>
                    <p className="fw-medium mb-0">Generated monthly inventory report</p>
                    <p className="text-muted small">1 week ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer bg-white text-center">
              <button className="btn btn-link text-decoration-none">View All Activity</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

