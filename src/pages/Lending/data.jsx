"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Modal from "../../components/Modal"
import { API_URL } from "../../../constant"
import { exportLendingHistory } from "../../utils/export-excel"

export default function LendingData() {
    const [lendings, setLendings] = useState([])
    const [error, setError] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [sortBy, setSortBy] = useState("date-desc")
    const [alert, setAlert] = useState("")
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedLending, setSelectedLending] = useState(null)
    const [restorationDetails, setRestorationDetails] = useState(null)
    const [formReturn, setFormReturn] = useState({
        lending_id: "",
        total_good_stuff: 0,
        total_defec_stuff: 0,
    })
    const [formErrors, setFormErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const navigate = useNavigate()

    // Fetch lending data
    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_URL}/lendings`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
            })
            setLendings(response.data.data || [])
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

    // Handle export to Excel
    const handleExport = async () => {
        try {
            setIsExporting(true)

            // If we're filtering data, export only the filtered data
            const dataToExport = filteredLendings.length > 0 ? filteredLendings : lendings

            // Export the data
            exportLendingHistory(dataToExport)

            setAlert("Data berhasil diekspor ke Excel")
        } catch (error) {
            console.error("Error exporting data:", error)
            setAlert("Gagal mengekspor data")
        } finally {
            setIsExporting(false)
        }
    }

    // Handle opening return modal
    const handleReturnClick = (lending) => {
        setSelectedLending(lending)
        setFormReturn({
            lending_id: lending.id,
            total_good_stuff: lending.total_stuff,
            total_defec_stuff: 0,
        })
        setFormErrors({})
        setIsReturnModalOpen(true)
    }

    // Handle opening detail modal
    const handleDetailClick = async (lending) => {
        try {
            setSelectedLending(lending)
            setIsDetailModalOpen(true)

            // If we already have restoration data in the lending object, use it
            if (lending.restoration) {
                setRestorationDetails(lending.restoration)
            } else {
                // Otherwise fetch the restoration details
                const response = await axios.get(`${API_URL}/restorations?lending_id=${lending.id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                })
                if (response.data.data && response.data.data.length > 0) {
                    setRestorationDetails(response.data.data[0])
                }
            }
        } catch (error) {
            console.error("Error fetching restoration details:", error)
            setError({ message: "Gagal memuat detail pengembalian" })
        }
    }

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target
        const numValue = Number.parseInt(value) || 0

        setFormReturn((prev) => {
            const newForm = { ...prev, [name]: numValue }

            // If changing good stuff, adjust defective stuff to maintain total
            if (name === "total_good_stuff" && selectedLending) {
                const totalBorrowed = selectedLending.total_stuff
                newForm.total_defec_stuff = Math.max(0, totalBorrowed - numValue)
            }

            // If changing defective stuff, adjust good stuff to maintain total
            if (name === "total_defec_stuff" && selectedLending) {
                const totalBorrowed = selectedLending.total_stuff
                newForm.total_good_stuff = Math.max(0, totalBorrowed - numValue)
            }

            return newForm
        })

        // Clear error when field is edited
        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }))
        }
    }

    // Handle return form submission
    const handleReturnSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setFormErrors({})

        // Validate that the total matches
        const totalReturned = formReturn.total_good_stuff + formReturn.total_defec_stuff
        if (totalReturned !== selectedLending.total_stuff) {
            setFormErrors({
                total: [
                    `Total barang yang dikembalikan (${totalReturned}) harus sama dengan yang dipinjam (${selectedLending.total_stuff})`,
                ],
            })
            setIsSubmitting(false)
            return
        }

        try {
            await axios.post(`${API_URL}/restorations`, formReturn, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    "Content-Type": "application/json",
                },
            })

            setAlert(`Berhasil mengembalikan barang ${selectedLending.stuff.name}`)
            setIsReturnModalOpen(false)
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
                setError(error.response?.data || { message: "Terjadi kesalahan saat memproses pengembalian" })
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

    // Filter and sort lendings
    const filteredLendings = lendings
        .filter((lending) => {
            // Filter by status
            if (filterStatus === "returned" && !lending.restoration) {
                return false
            }
            if (filterStatus === "borrowed" && lending.restoration) {
                return false
            }

            // Filter by search query
            if (
                searchQuery &&
                !(
                    (lending.stuff?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (lending.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (lending.id || "").toLowerCase().includes(searchQuery.toLowerCase())
                )
            ) {
                return false
            }

            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "date-desc":
                    return new Date(b.date_time || b.created_at).getTime() - new Date(a.date_time || a.created_at).getTime()
                case "date-asc":
                    return new Date(a.date_time || a.created_at).getTime() - new Date(b.date_time || b.created_at).getTime()
                case "name-asc":
                    return (a.stuff?.name || "").localeCompare(b.stuff?.name || "")
                case "name-desc":
                    return (b.stuff?.name || "").localeCompare(a.stuff?.name || "")
                case "borrower-asc":
                    return (a.name || "").localeCompare(b.name || "")
                case "borrower-desc":
                    return (b.name || "").localeCompare(a.name || "")
                default:
                    return 0
            }
        })

    // Stats for the dashboard
    const stats = {
        total: lendings.length,
        returned: lendings.filter((lending) => lending.restoration).length,
        borrowed: lendings.filter((lending) => !lending.restoration).length,
        totalItems: lendings.reduce((sum, lending) => sum + (Number.parseInt(lending.total_stuff) || 0), 0),
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="row mb-4 align-items-center">
        <div className="col-md-6">
          <h2 className="mb-0">Riwayat Peminjaman</h2>
          <p className="text-muted">Kelola dan lihat semua data peminjaman barang</p>
        </div>
        <div className="col-md-6 text-md-end">
          <button 
            className="btn btn-success" 
            onClick={handleExport}
            disabled={isExporting || loading || lendings.length === 0}
          >
            {isExporting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Mengekspor...
              </>
            ) : (
              <>
                <span className="me-2">📊</span> Export Excel
              </>
            )}
          </button>
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
                        <div className="col-md-5">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <span>🔍</span>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cari berdasarkan nama barang, peminjam, atau ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">Semua Status</option>
                                <option value="borrowed">Sedang Dipinjam</option>
                                <option value="returned">Sudah Dikembalikan</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="date-desc">Tanggal (Terbaru)</option>
                                <option value="date-asc">Tanggal (Terlama)</option>
                                <option value="name-asc">Nama Barang (A-Z)</option>
                                <option value="name-desc">Nama Barang (Z-A)</option>
                                <option value="borrower-asc">Nama Peminjam (A-Z)</option>
                                <option value="borrower-desc">Nama Peminjam (Z-A)</option>
                            </select>
                        </div>
                        <div className="col-md-1">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => {
                                    setFilterStatus("all")
                                    setSearchQuery("")
                                    setSortBy("date-desc")
                                }}
                            >
                                <span>🔄</span>
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
                                    <h6 className="text-muted mb-1">Total Peminjaman</h6>
                                    <h3 className="mb-0">{stats.total}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">📋</span>
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
                                    <h6 className="text-muted mb-1">Sudah Dikembalikan</h6>
                                    <h3 className="mb-0">{stats.returned}</h3>
                                </div>
                                <div className="bg-success bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">✅</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-warning bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Sedang Dipinjam</h6>
                                    <h3 className="mb-0">{stats.borrowed}</h3>
                                </div>
                                <div className="bg-warning bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">⏳</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lendings Table */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Daftar Peminjaman</h5>
                        <span className="badge bg-primary">{filteredLendings.length} peminjaman</span>
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
                                        <th scope="col">Peminjam</th>
                                        <th scope="col">Jumlah</th>
                                        <th scope="col">Tanggal Pinjam</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Catatan</th>
                                        <th scope="col" className="text-end pe-4">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLendings.length > 0 ? (
                                        filteredLendings.map((lending) => {
                                            const isReturned = !!lending.restoration

                                            return (
                                                <tr key={lending.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded p-2 me-3">
                                                                <span className="fs-4">
                                                                    {lending.stuff?.type === "Lab"
                                                                        ? "💻"
                                                                        : lending.stuff?.type === "HTL/KLN"
                                                                            ? "🏨"
                                                                            : "🔧"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{lending.stuff?.name || "N/A"}</h6>
                                                                <small className="text-muted">{lending.stuff?.type || "N/A"}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <span className="fw-medium">{lending.name}</span>
                                                            <br />
                                                            <small className="text-muted">{lending.user?.username || "N/A"}</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-primary">{lending.total_stuff} unit</span>
                                                    </td>
                                                    <td>{formatDate(lending.date_time || lending.created_at)}</td>
                                                    <td>
                                                        {isReturned ? (
                                                            <span className="badge bg-success">Sudah Dikembalikan</span>
                                                        ) : (
                                                            <span className="badge bg-warning text-dark">Sedang Dipinjam</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="text-muted">{lending.notes || "-"}</span>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        {isReturned ? (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleDetailClick(lending)}
                                                            >
                                                                <span className="me-1">📋</span> Detail
                                                            </button>
                                                        ) : (
                                                            <button className="btn btn-sm btn-success" onClick={() => handleReturnClick(lending)}>
                                                                <span className="me-1">↩️</span> Kembalikan
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                {searchQuery || filterStatus !== "all" ? (
                                                    <div>
                                                        <p className="mb-0">Tidak ada data yang sesuai dengan filter</p>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary mt-2"
                                                            onClick={() => {
                                                                setFilterStatus("all")
                                                                setSearchQuery("")
                                                            }}
                                                        >
                                                            Reset Filter
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="mb-0">Belum ada data peminjaman</p>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {filteredLendings.length > 0 && (
                    <div className="card-footer bg-white py-3">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <p className="mb-0">
                                    Menampilkan <strong>1-{filteredLendings.length}</strong> dari <strong>{lendings.length}</strong>{" "}
                                    peminjaman
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

            {/* Return Modal */}
            <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Form Pengembalian Barang">
                <form onSubmit={handleReturnSubmit}>
                    {error && Object.keys(error).length > 0 && (
                        <div className="alert alert-danger mb-3">
                            <p className="mb-0">{error.message || "Terjadi kesalahan saat memproses pengembalian"}</p>
                        </div>
                    )}

                    {selectedLending && (
                        <div className="mb-4">
                            <div className="card bg-light border-0">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-white rounded p-2 me-3">
                                            <span className="fs-4">
                                                {selectedLending.stuff?.type === "Lab"
                                                    ? "💻"
                                                    : selectedLending.stuff?.type === "HTL/KLN"
                                                        ? "🏨"
                                                        : "🔧"}
                                            </span>
                                        </div>
                                        <div>
                                            <h6 className="mb-1">{selectedLending.stuff?.name}</h6>
                                            <p className="mb-0 small text-muted">Dipinjam oleh: {selectedLending.name}</p>
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <div className="bg-white rounded p-2">
                                                <small className="text-muted d-block">Tanggal Peminjaman</small>
                                                <span>{formatDate(selectedLending.date_time || selectedLending.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="bg-white rounded p-2">
                                                <small className="text-muted d-block">Jumlah Dipinjam</small>
                                                <span className="fw-bold">{selectedLending.total_stuff} unit</span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedLending.notes && (
                                        <div className="bg-white rounded p-2">
                                            <small className="text-muted d-block">Catatan</small>
                                            <span>{selectedLending.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden lending_id field */}
                    <input type="hidden" name="lending_id" value={formReturn.lending_id} />

                    {formErrors.total && (
                        <div className="alert alert-danger mb-3">
                            <p className="mb-0">{formErrors.total[0]}</p>
                        </div>
                    )}

                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label htmlFor="total_good_stuff" className="form-label">
                                Jumlah Barang Baik <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                className={`form-control ${formErrors.total_good_stuff ? "is-invalid" : ""}`}
                                id="total_good_stuff"
                                name="total_good_stuff"
                                value={formReturn.total_good_stuff}
                                onChange={handleInputChange}
                                min="0"
                                max={selectedLending?.total_stuff || 0}
                                required
                            />
                            {formErrors.total_good_stuff && <div className="invalid-feedback">{formErrors.total_good_stuff[0]}</div>}
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="total_defec_stuff" className="form-label">
                                Jumlah Barang Rusak <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                className={`form-control ${formErrors.total_defec_stuff ? "is-invalid" : ""}`}
                                id="total_defec_stuff"
                                name="total_defec_stuff"
                                value={formReturn.total_defec_stuff}
                                onChange={handleInputChange}
                                min="0"
                                max={selectedLending?.total_stuff || 0}
                                required
                            />
                            {formErrors.total_defec_stuff && (
                                <div className="invalid-feedback">{formErrors.total_defec_stuff[0]}</div>
                            )}
                        </div>
                    </div>

                    <div className="alert alert-info">
                        <small>
                            <strong>Catatan:</strong> Total barang baik dan rusak harus sama dengan jumlah yang dipinjam (
                            {selectedLending?.total_stuff || 0} unit).
                        </small>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                        <button
                            type="button"
                            className="btn btn-outline-secondary me-2"
                            onClick={() => setIsReturnModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Memproses...
                                </>
                            ) : (
                                "Kembalikan Barang"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Pengembalian">
                {selectedLending && (
                    <div>
                        <div className="card bg-light border-0 mb-4">
                            <div className="card-body">
                                <h6 className="card-title mb-3">Informasi Peminjaman</h6>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="bg-white rounded p-3">
                                            <small className="text-muted d-block">Nama Barang</small>
                                            <span className="fw-medium">{selectedLending.stuff?.name}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="bg-white rounded p-3">
                                            <small className="text-muted d-block">Tipe Barang</small>
                                            <span>{selectedLending.stuff?.type}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="bg-white rounded p-3">
                                            <small className="text-muted d-block">Nama Peminjam</small>
                                            <span className="fw-medium">{selectedLending.name}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="bg-white rounded p-3">
                                            <small className="text-muted d-block">Petugas</small>
                                            <span>{selectedLending.user?.username || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="bg-white rounded p-3">
                                            <small className="text-muted d-block">Tanggal Peminjaman</small>
                                            <span>{formatDate(selectedLending.date_time || selectedLending.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="bg-white rounded p-3">
                                            <small className="text-muted d-block">Jumlah Dipinjam</small>
                                            <span className="fw-bold">{selectedLending.total_stuff} unit</span>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="bg-white rounded p-3">
                                            <small className="text-muted d-block">Catatan</small>
                                            <span>{selectedLending.notes || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 bg-success bg-opacity-10">
                            <div className="card-body">
                                <h6 className="card-title mb-3">Informasi Pengembalian</h6>

                                <div className="row g-3">
                                    {selectedLending.restoration && (
                                        <>
                                            <div className="col-md-6">
                                                <div className="bg-white rounded p-3">
                                                    <small className="text-muted d-block">Tanggal Pengembalian</small>
                                                    <span>
                                                        {formatDate(
                                                            selectedLending.restoration.date_time || selectedLending.restoration.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="bg-white rounded p-3">
                                                    <small className="text-muted d-block">Petugas Pengembalian</small>
                                                    <span>{selectedLending.restoration.user?.username || "N/A"}</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="bg-white rounded p-3">
                                                    <small className="text-muted d-block">Jumlah Barang Baik</small>
                                                    <span className="fw-medium text-success">
                                                        {selectedLending.restoration.total_good_stuff} unit
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="bg-white rounded p-3">
                                                    <small className="text-muted d-block">Jumlah Barang Rusak</small>
                                                    <span
                                                        className={`fw-medium ${selectedLending.restoration.total_defec_stuff > 0 ? "text-danger" : "text-muted"}`}
                                                    >
                                                        {selectedLending.restoration.total_defec_stuff} unit
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
