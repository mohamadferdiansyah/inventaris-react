"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Modal from "../../components/Modal"
import { API_URL } from "../../../constant"

export default function LendingIndex() {
    const [items, setItems] = useState([])
    const [error, setError] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [sortBy, setSortBy] = useState("name-asc")
    const [alert, setAlert] = useState("")
    const [isLendingModalOpen, setIsLendingModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [formLending, setFormLending] = useState({
        stuff_id: "",
        name: "",
        total_stuff: 1,
        note: "",
    })
    const [formErrors, setFormErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate()

    // Fetch available items
    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_URL}/stuffs`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
            })
            setItems(response.data.data || [])
            setError({})
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem("access_token")
                localStorage.removeItem("user")
                navigate("/login", { replace: true })
            } else {
                setError(error.response?.data || { message: "Terjadi kesalahan saat mengambil data" })
            }
        } finally {
            setLoading(false)
        }
    }

    // Handle opening lending modal
    const handleLendingClick = (item) => {
        setSelectedItem(item)
        setFormLending({
            stuff_id: item.id,
            name: "",
            total_stuff: 1,
            note: "",
        })
        setFormErrors({})
        setIsLendingModalOpen(true)
    }

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormLending((prev) => ({
            ...prev,
            [name]: value,
        }))
        // Clear error when field is edited
        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }))
        }
    }

    // Handle lending form submission
    const handleLendingSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setFormErrors({})

        try {
            await axios.post(`${API_URL}/lendings`, formLending, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    "Content-Type": "application/json",
                },
            })

            setAlert(`Berhasil meminjam ${selectedItem.name}`)
            setIsLendingModalOpen(false)
            fetchData() // Refresh data
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem("access_token")
                localStorage.removeItem("user")
                navigate("/login", { replace: true })
            } else if (error.response && error.response.status === 422) {
                // Validation errors
                setFormErrors(error.response.data.data || {})
            } else {
                setError(error.response?.data || { message: "Terjadi kesalahan saat memproses peminjaman" })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Load data on component mount
    useEffect(() => {
        fetchData()
    }, [navigate])

    // Auto-dismiss alert after 3 seconds
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert("")
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [alert])

    // Get unique item types for filtering
    const uniqueTypes = [...new Set(items.map((item) => item.type))]

    // Filter and sort items
    const filteredItems = items
        .filter((item) => {
            // Filter by type
            if (filterType !== "all" && item.type !== filterType) {
                return false
            }

            // Filter by search query
            if (
                searchQuery &&
                !(
                    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.id || "").toLowerCase().includes(searchQuery.toLowerCase())
                )
            ) {
                return false
            }

            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc":
                    return (a.name || "").localeCompare(b.name || "")
                case "name-desc":
                    return (b.name || "").localeCompare(a.name || "")
                case "stock-asc":
                    const stockA = a.stuff_stock ? a.stuff_stock.total_available : 0
                    const stockB = b.stuff_stock ? b.stuff_stock.total_available : 0
                    return stockA - stockB
                case "stock-desc":
                    const stockADesc = a.stuff_stock ? a.stuff_stock.total_available : 0
                    const stockBDesc = b.stuff_stock ? b.stuff_stock.total_available : 0
                    return stockBDesc - stockADesc
                case "updated-desc":
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                case "updated-asc":
                    return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
                default:
                    return 0
            }
        })

    // Stats for the dashboard
    const stats = {
        total: items.length,
        available: items.filter((item) => item.stuff_stock && item.stuff_stock.total_available > 0).length,
        unavailable: items.filter((item) => !item.stuff_stock || item.stuff_stock.total_available === 0).length,
        totalStock: items.reduce((sum, item) => sum + (item.stuff_stock ? item.stuff_stock.total_available : 0), 0),
    }

    // Get item status (for badges)
    const getItemStatus = (item) => {
        if (!item.stuff_stock) return { status: "Belum Tersedia", badgeClass: "bg-secondary" }

        const available = item.stuff_stock.total_available
        const defective = item.stuff_stock.total_defec

        if (available === 0) return { status: "Tidak Tersedia", badgeClass: "bg-danger" }
        if (available <= 5) return { status: "Stok Terbatas", badgeClass: "bg-warning text-dark" }
        return { status: "Tersedia", badgeClass: "bg-success" }
    }

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <h2 className="mb-0">Peminjaman Barang</h2>
                    <p className="text-muted">Kelola dan pinjam barang yang tersedia</p>
                </div>
            </div>

            {/* Alert */}
            {alert && (
                <div className="alert alert-success mb-4" role="alert">
                    {alert}
                </div>
            )}

            {/* Filters and Search */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <span>🔍</span>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cari berdasarkan nama barang atau ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">Semua Tipe</option>
                                {uniqueTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="name-asc">Nama (A-Z)</option>
                                <option value="name-desc">Nama (Z-A)</option>
                                <option value="stock-asc">Stok (Rendah ke Tinggi)</option>
                                <option value="stock-desc">Stok (Tinggi ke Rendah)</option>
                                <option value="updated-desc">Terakhir Diperbarui (Terbaru)</option>
                                <option value="updated-asc">Terakhir Diperbarui (Terlama)</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => {
                                    setFilterType("all")
                                    setSearchQuery("")
                                    setSortBy("name-asc")
                                }}
                            >
                                <span className="me-2">🔄</span> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Total Barang</h6>
                                    <h3 className="mb-0">{stats.total}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">📦</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Barang Tersedia</h6>
                                    <h3 className="mb-0">{stats.available}</h3>
                                </div>
                                <div className="bg-success bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">✅</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-danger bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Tidak Tersedia</h6>
                                    <h3 className="mb-0">{stats.unavailable}</h3>
                                </div>
                                <div className="bg-danger bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">❌</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Daftar Barang</h5>
                        <span className="badge bg-primary">{filteredItems.length} barang</span>
                    </div>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Memuat data...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th scope="col" className="ps-4">
                                            Nama Barang
                                        </th>
                                        <th scope="col">ID</th>
                                        <th scope="col">Tipe</th>
                                        <th scope="col">Stok Tersedia</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Terakhir Diperbarui</th>
                                        <th scope="col" className="text-end pe-4">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => {
                                            const { status, badgeClass } = getItemStatus(item)
                                            const isAvailable = item.stuff_stock && item.stuff_stock.total_available > 0

                                            return (
                                                <tr key={item.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded p-2 me-3">
                                                                <span className="fs-4">
                                                                    {item.type === "Lab" ? "💻" : item.type === "HTL/KLN" ? "🏨" : "🔧"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{item.name}</h6>
                                                                <small className="text-muted">{item.type}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">{item.id.substring(0, 8)}...</small>
                                                    </td>
                                                    <td>{item.type}</td>
                                                    <td>
                                                        <span className={`fw-bold ${isAvailable ? "text-success" : "text-danger"}`}>
                                                            {item.stuff_stock ? item.stuff_stock.total_available : 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${badgeClass}`}>{status}</span>
                                                    </td>
                                                    <td>
                                                        {new Date(item.updated_at).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleLendingClick(item)}
                                                            disabled={!isAvailable}
                                                        >
                                                            <span className="me-1">📝</span> Pinjam
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                {searchQuery || filterType !== "all" ? (
                                                    <div>
                                                        <p className="mb-0">Tidak ada barang yang sesuai dengan filter</p>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary mt-2"
                                                            onClick={() => {
                                                                setFilterType("all")
                                                                setSearchQuery("")
                                                            }}
                                                        >
                                                            Reset Filter
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="mb-0">Belum ada data barang</p>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {filteredItems.length > 0 && (
                    <div className="card-footer bg-white py-3">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <p className="mb-0">
                                    Menampilkan <strong>1-{filteredItems.length}</strong> dari <strong>{items.length}</strong> barang
                                </p>
                            </div>
                            <div className="col-md-6">
                                <nav aria-label="Page navigation">
                                    <ul className="pagination justify-content-md-end mb-0">
                                        <li className="page-item disabled">
                                            <a className="page-link" href="#" tabIndex="-1" aria-disabled="true">
                                                Sebelumnya
                                            </a>
                                        </li>
                                        <li className="page-item active">
                                            <a className="page-link" href="#">
                                                1
                                            </a>
                                        </li>
                                        <li className="page-item disabled">
                                            <a className="page-link" href="#">
                                                Selanjutnya
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Lending Modal */}
            <Modal isOpen={isLendingModalOpen} onClose={() => setIsLendingModalOpen(false)} title="Form Peminjaman Barang">
                <form onSubmit={handleLendingSubmit}>
                    {error && Object.keys(error).length > 0 && (
                        <div className="alert alert-danger mb-3">
                            <p className="mb-0">{error.message || "Terjadi kesalahan saat memproses peminjaman"}</p>
                        </div>
                    )}

                    {selectedItem && (
                        <div className="mb-4">
                            <div className="card bg-light border-0">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-white rounded p-2 me-3">
                                            <span className="fs-4">
                                                {selectedItem.type === "Lab" ? "💻" : selectedItem.type === "HTL/KLN" ? "🏨" : "🔧"}
                                            </span>
                                        </div>
                                        <div>
                                            <h6 className="mb-1">{selectedItem.name}</h6>
                                            <p className="mb-0 small text-muted">
                                                Stok tersedia: {selectedItem.stuff_stock ? selectedItem.stuff_stock.total_available : 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden stuff_id field */}
                    <input type="hidden" name="stuff_id" value={formLending.stuff_id} />

                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">
                            Nama Peminjam <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                            id="name"
                            name="name"
                            value={formLending.name}
                            onChange={handleInputChange}
                            placeholder="Masukkan nama peminjam"
                            required
                        />
                        {formErrors.name && <div className="invalid-feedback">{formErrors.name[0]}</div>}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="total_stuff" className="form-label">
                            Jumlah Barang <span className="text-danger">*</span>
                        </label>
                        <input
                            type="number"
                            className={`form-control ${formErrors.total_stuff ? "is-invalid" : ""}`}
                            id="total_stuff"
                            name="total_stuff"
                            value={formLending.total_stuff}
                            onChange={handleInputChange}
                            min="1"
                            max={selectedItem?.stuff_stock?.total_available || 1}
                            required
                        />
                        {formErrors.total_stuff && <div className="invalid-feedback">{formErrors.total_stuff[0]}</div>}
                        <small className="text-muted">Maksimal: {selectedItem?.stuff_stock?.total_available || 0} unit</small>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="note" className="form-label">
                            Catatan
                        </label>
                        <textarea
                            className="form-control"
                            id="note"
                            name="note"
                            value={formLending.note}
                            onChange={handleInputChange}
                            placeholder="Masukkan catatan (opsional)"
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                        <button
                            type="button"
                            className="btn btn-outline-secondary me-2"
                            onClick={() => setIsLendingModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Memproses...
                                </>
                            ) : (
                                "Pinjam Barang"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
