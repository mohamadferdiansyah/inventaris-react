"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../../constant"
import Modal from "../../components/Modal"
import { exportInventoryItems } from "../../utils/export-excel"

export default function StuffIndex() {
    const [stuffs, setStuffs] = useState([])
    const [error, setError] = useState({})
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState("name-asc")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formModal, setFormModal] = useState({
        name: "",
        type: "",
    })
    const [formInbound, setFormInbound] = useState({
        stuff_id: "",
        total: 0,
        proof_file: null
    })
    const [alert, setAlert] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isAddStock, setIsAddStock] = useState(false)
    const [editItemId, setEditItemId] = useState(null)
    const [selectedItem, setSelectedItem] = useState(null)
    const [isExporting, setIsExporting] = useState(false)

    const navigate = useNavigate()

    // Handle export to Excel
  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // If we're filtering data, export only the filtered data
      const dataToExport = filteredItems.length > 0 ? filteredItems : stuffs
      
      // Export the data
      exportInventoryItems(dataToExport)
      
      setAlert("Data berhasil diekspor ke Excel")
    } catch (error) {
      console.error("Error exporting data:", error)
      setAlert("Gagal mengekspor data")
    } finally {
      setIsExporting(false)
    }
  }
    
    // Reset form when modal closes
    const handleCloseModal = () => {
        setIsModalOpen(false)
        setFormModal({
            name: "",
            type: "",
        })
        setIsEditing(false)
        setIsDeleting(false)
        setIsAddStock(false)
        setEditItemId(null)
        setSelectedItem(null)
        setError({})
    }

    // Handle opening edit modal
    const handleEditClick = (item) => {
        const typeMapping = {
            "HTL/KLN": "HTL/KLN",
            "LAB": "Lab",
            "SARPRAS": "Sarpras",
        }
        setFormModal({
            name: item.name,
            type: typeMapping[item.type] || item.type,
        })
        setEditItemId(item.id)
        setSelectedItem(item)
        setIsEditing(true)
        setIsDeleting(false)
        setIsAddStock(false)
        setIsModalOpen(true)
    }

    // Handle opening delete confirmation modal
    const handleDeleteClick = (item) => {
        setSelectedItem(item)
        setEditItemId(item.id)
        setIsDeleting(true)
        setIsEditing(false)
        setIsAddStock(false)
        setIsModalOpen(true)
    }

    const handleAddStockClick = (item) => {
        setSelectedItem(item)
        setEditItemId(item.id)
        setFormInbound({
            stuff_id: item.id,
            total: 0,
            proof_file: null,
        })
        setIsAddStock(true)
        setIsEditing(false)
        setIsDeleting(false)
        setIsModalOpen(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (isDeleting) {
            // Handle delete operation
            axios
                .delete(`${API_URL}/stuffs/${editItemId}`)
                .then((response) => {
                    setIsModalOpen(false)
                    setAlert("Barang berhasil dihapus")
                    fetchData() // Refresh data after successful operation
                    handleCloseModal()
                })
                .catch((error) => {
                    if (error.response && error.response.status === 401) {
                        localStorage.removeItem("access_token")
                        localStorage.removeItem("user")
                        navigate("/login", { replace: true })
                    }
                    setError(error.response?.data || { message: "Terjadi kesalahan saat menghapus barang" })
                })
            return
        }

        if (isAddStock) {
            const formData = new FormData()
            formData.append("stuff_id", formInbound.stuff_id)
            formData.append("total", formInbound.total)
            formData.append("proof_file", formInbound.proof_file)

            axios.post(`${API_URL}/inbound-stuffs`, formData)
                .then(res => {
                    setIsModalOpen(false)
                    setFormInbound({
                        stuff_id: "",
                        total: 0,
                        proof_file: null,
                    })
                    setAlert("Stok barang berhasil ditambahkan")
                    fetchData()
                    handleCloseModal()
                })
                .catch((error) => {
                    if (error.response && error.response.status === 401) {
                        localStorage.removeItem("access_token")
                        localStorage.removeItem("user")
                        navigate("/login", { replace: true })
                    }
                    setError(error.response?.data || { message: "Terjadi kesalahan saat menambah stok barang" })
                })
            return
        }

        // Determine if we're adding or editing
        const url = isEditing ? `${API_URL}/stuffs/${editItemId}` : `${API_URL}/stuffs`

        // Use appropriate HTTP method
        const method = isEditing ? axios.patch : axios.post

        method(url, formModal)
            .then((response) => {
                setIsModalOpen(false)
                setAlert(isEditing ? "Barang berhasil diperbarui" : "Barang berhasil ditambahkan")
                fetchData() // Refresh data after successful operation
                handleCloseModal()
            })
            .catch((error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem("access_token")
                    localStorage.removeItem("user")
                    navigate("/login", { replace: true })
                }
                console.log(error.response?.data)
                setError(error.response?.data || { message: "Terjadi kesalahan" })
            })
    }

    const fetchData = () => {
        setLoading(true);
        axios
            .get(API_URL + "/stuffs")
            .then((response) => {
                setStuffs(response.data.data);
                setError({});
            })
            .catch((error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    navigate("/login", { replace: true });
                } else {
                    setError(error.response?.data || { message: "Terjadi kesalahan saat mengambil data" });
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Panggil fetchData saat komponen pertama kali dirender
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

    const uniqueTypes = [...new Set(stuffs.map((item) => item.type))]

    const filteredItems = stuffs
        .filter((item) => {
            if (filterType !== "all" && item.type !== filterType) {
                return false
            }

            if (
                searchQuery &&
                !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !item.id.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
                return false
            }

            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc":
                    return a.name.localeCompare(b.name)
                case "name-desc":
                    return b.name.localeCompare(a.name)
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

    const getItemStatus = (item) => {
        if (!item.stuff_stock) return { status: "Belum Tersedia", badgeClass: "bg-secondary" }

        const available = item.stuff_stock.total_available
        const defective = item.stuff_stock.total_defec
        const total = available + defective

        if (available === 0) return { status: "Habis", badgeClass: "bg-danger" }
        if (available <= 5) return { status: "Stok Rendah", badgeClass: "bg-warning text-dark" }
        return { status: "Tersedia", badgeClass: "bg-success" }
    }

    const stats = {
        total: stuffs.length,
        available: stuffs.filter((item) => item.stuff_stock && item.stuff_stock.total_available > 0).length,
        lowStock: stuffs.filter(
            (item) => item.stuff_stock && item.stuff_stock.total_available > 0 && item.stuff_stock.total_available <= 5,
        ).length,
        outOfStock: stuffs.filter((item) => !item.stuff_stock || item.stuff_stock.total_available === 0).length,
    }

    // Determine modal title based on current mode
    const getModalTitle = () => {
        if (isDeleting) return "Hapus Barang"
        if (isEditing) return "Edit Barang"
        if (isAddStock) return "Tambah Stok Barang"
        return "Tambah Barang"
    }

    // Render different modal content based on mode
    const renderModalContent = () => {
        if (isDeleting && selectedItem) {
            return (
                <div>
                    <div className="alert alert-danger">
                        <p className="mb-0">
                            Apakah Anda yakin ingin menghapus barang <strong>{selectedItem.name}</strong>?
                        </p>
                        <p className="mb-0 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={handleCloseModal}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-danger" onClick={handleSubmit}>
                            Hapus
                        </button>
                    </div>
                </div>
            )
        } else if (isAddStock && selectedItem) {
            return (
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                        {error && Object.keys(error).length > 0 ? (
                            <div className="alert alert-danger" role="alert">
                                <ul className="mb-0">
                                    {error.data && Object.entries(error.data).length > 0 ? (
                                        Object.entries(error.data).map(([key, value]) => <li key={key}>{value}</li>)
                                    ) : (
                                        <li>{error.message}</li>
                                    )}
                                </ul>
                            </div>
                        ) : null}
                        <label className="form-label">Stok Barang</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Masukkan Stok Barang"
                            onChange={(e) => setFormInbound({ ...formInbound, total: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Bukti Foto</label>
                        <input
                            type="file"
                            className="form-control"
                            placeholder="Masukkan Stok Barang"
                            onChange={(e) => setFormInbound({ ...formInbound, proof_file: e.target.files[0] })}
                        />
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={handleCloseModal}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Tambah Stok
                        </button>
                    </div>
                </form>
            )
        }



        return (
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    {error && Object.keys(error).length > 0 ? (
                        <div className="alert alert-danger" role="alert">
                            <ul className="mb-0">
                                {error.data && Object.entries(error.data).length > 0 ? (
                                    Object.entries(error.data).map(([key, value]) => <li key={key}>{value}</li>)
                                ) : (
                                    <li>{error.message}</li>
                                )}
                            </ul>
                        </div>
                    ) : null}
                    <label className="form-label">Nama Barang</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Masukkan nama barang"
                        value={formModal.name}
                        onChange={(e) => setFormModal({ ...formModal, name: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="itemType" className="form-label">
                        Tipe Barang
                    </label>
                    <select
                        className="form-select"
                        value={formModal.type}
                        onChange={(e) => setFormModal({ ...formModal, type: e.target.value })}
                    >
                        <option value="" hidden disabled>
                            Pilih tipe barang
                        </option>
                        <option value="HTL/KLN">HTL/KLN</option>
                        <option value="Lab">Lab</option>
                        <option value="Sarpras">Sarpas</option>
                    </select>
                </div>
                <div className="d-flex justify-content-end mt-4">
                    <button type="button" className="btn btn-outline-secondary me-2" onClick={handleCloseModal}>
                        Batal
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {isEditing ? "Simpan" : "Tambah"}
                    </button>
                </div>
            </form>
        )
    }

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <h2 className="mb-0">Inventaris Barang</h2>
                    <p className="text-muted">Kelola dan lihat semua barang inventaris</p>
                </div>
                <div className="col-md-6 text-md-end">
                    <button
                        className="btn btn-primary me-2"
                        onClick={() => {
                            setFormModal({ name: "", type: "" })
                            setIsEditing(false)
                            setIsDeleting(false)
                            setIsModalOpen(true)
                        }}
                    >
                        <span className="me-2">+</span> Tambah Barang
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={handleExport}
                        disabled={isExporting || loading || stuffs.length === 0}
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
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <span>🔍</span>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cari berdasarkan nama atau ID..."
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

            {/* Inventory Stats */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
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
                <div className="col-md-3">
                    <div className="card bg-success bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Tersedia</h6>
                                    <h3 className="mb-0">{stats.available}</h3>
                                </div>
                                <div className="bg-success bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">✅</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Stok Rendah</h6>
                                    <h3 className="mb-0">{stats.lowStock}</h3>
                                </div>
                                <div className="bg-warning bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">⚠️</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-danger bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Tidak Tersedia</h6>
                                    <h3 className="mb-0">{stats.outOfStock}</h3>
                                </div>
                                <div className="bg-danger bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">❗</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Items Table */}
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
                                        <th scope="col">Rusak</th>
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
                                            return (
                                                <tr key={item.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded p-2 me-3">
                                                                <span className="fs-4">
                                                                    {item.type === "LAB" ? "💻" : item.type === "HTL/KLN" ? "🏨" : "🔧"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{item.name.substring(0, 10)}</h6>
                                                                <small className="text-muted">{item.type}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">{item.id.substring(0, 8)}...</small>
                                                    </td>
                                                    <td>{item.type}</td>
                                                    <td>{item.stuff_stock ? item.stuff_stock.total_available : "-"}</td>
                                                    <td className={`fw-semibold ${item.stuff_stock?.total_defec <= 3 ? "text-danger" : ""}`}>
                                                        {item.stuff_stock ? item.stuff_stock.total_defec : "-"}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${badgeClass}`}>{status}</span>
                                                    </td>
                                                    <td>{new Date(item.updated_at).toLocaleDateString("id-ID")}</td>
                                                    <td className="text-end pe-4">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary me-2"
                                                            onClick={() => handleAddStockClick(item)}
                                                        >
                                                            Tambah Stock
                                                        </button>
                                                        <div className="btn-group">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                                data-bs-toggle="dropdown"
                                                                aria-expanded="false"
                                                            >
                                                                Lainnya
                                                            </button>
                                                            <ul className="dropdown-menu">
                                                                <li>
                                                                    <button className="dropdown-item" onClick={() => handleEditClick(item)}>
                                                                        Edit Barang
                                                                    </button>
                                                                </li>
                                                                <li>
                                                                    <a className="dropdown-item" href={`/stuffs/${item.id}`}>
                                                                        Lihat Detail
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <hr className="dropdown-divider" />
                                                                </li>
                                                                <li>
                                                                    <button className="dropdown-item text-danger" onClick={() => handleDeleteClick(item)}>
                                                                        Hapus
                                                                    </button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-4">
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
                                    Menampilkan <strong>1-{filteredItems.length}</strong> dari <strong>{stuffs.length}</strong> barang
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
            {/* Modal Add/Edit/Delete Product */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
                {renderModalContent()}
            </Modal>
        </div>
    )
}
