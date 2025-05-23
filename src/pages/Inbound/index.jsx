"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../constant";
import Modal from "../../components/Modal";
import { exportInboundItems } from "../../utils/export-excel"

export default function InboundIndex() {
    const [inboundItems, setInboundItems] = useState([]);
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const [alert, setAlert] = useState("");
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isExporting, setIsExporting] = useState(false)

    const navigate = useNavigate();

    // ngambil data inbound dari api
    const fetchData = () => {
        axios
            .get(`${API_URL}/inbound-stuffs`)
            .then((response) => {
                setLoading(false);
                setInboundItems(response.data.data || []);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    // Handle export to Excel
    const handleExport = async () => {
        try {
            setIsExporting(true)

            // If we're filtering data, export only the filtered data
            const dataToExport = filteredItems.length > 0 ? filteredItems : inboundItems

            // Export the data
            exportInboundItems(dataToExport)

            setAlert("Data berhasil diekspor ke Excel")
        } catch (error) {
            console.error("Error exporting data:", error)
            setAlert("Gagal mengekspor data")
        } finally {
            setIsExporting(false)
        }
    }

    // function buat hapus data inbound
    const handleDelete = () => {
        axios.delete(`${API_URL}/inbound-stuffs/${selectedItem.id}`)
            .then(() => {
                setAlert("Data barang masuk berhasil dihapus");
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
                fetchData();
            })
            .catch((error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    navigate("/login", { replace: true });
                } else {
                    setError(
                        error.response?.data || {
                            message: "Terjadi kesalahan saat menghapus data",
                        }
                    );
                }
            });
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    const filteredItems = inboundItems
        .filter((item) => {
            if (searchQuery && !((item.stuff?.name).toLowerCase().includes(searchQuery.toLowerCase()) || (item.id).toLowerCase().includes(searchQuery.toLowerCase()))) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "date-desc":
                    return (
                        new Date(b.date_time).getTime() -
                        new Date(a.date_time).getTime()
                    );
                case "date-asc":
                    return (
                        new Date(a.date_time).getTime() -
                        new Date(b.date_time).getTime()
                    );
                case "name-asc":
                    return (a.stuff?.name).localeCompare(b.stuff?.name);
                case "name-desc":
                    return (b.stuff?.name).localeCompare(a.stuff?.name);
                case "total-asc":
                    return (a.total) - (b.total);
                case "total-desc":
                    return (b.total) - (a.total);
                default:
                    return 0;
            }
        });

    const stats = {
        total: inboundItems.length,
        totalItems: inboundItems.reduce(
            (sum, item) => sum + (Number.parseInt(item.total) || 0),
            0
        ),
        uniqueProducts: new Set(inboundItems.map((item) => item.stuff?.id)).size,
        lastUpdate:
            inboundItems.length > 0
                ? new Date(inboundItems[0].created_at).toLocaleDateString("id-ID")
                : "-",
    };

    return (
        <div className="container-fluid py-4">
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <h2 className="mb-0">Laporan Barang Masuk</h2>
                    <p className="text-muted">Kelola dan lihat semua data barang masuk</p>
                </div>
                <div className="col-md-6 text-md-end">
                    <button
                        className="btn btn-success"
                        onClick={handleExport}
                        disabled={isExporting || loading || inboundItems.length === 0}
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

            {alert && (
                <div className="alert alert-success mb-4" role="alert">
                    {alert}
                </div>
            )}

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
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
                        <div className="col-md-4">
                            <select
                                className="form-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="date-desc">Tanggal (Terbaru)</option>
                                <option value="date-asc">Tanggal (Terlama)</option>
                                <option value="name-asc">Nama Barang (A-Z)</option>
                                <option value="name-desc">Nama Barang (Z-A)</option>
                                <option value="total-desc">Jumlah (Terbanyak)</option>
                                <option value="total-asc">Jumlah (Tersedikit)</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSortBy("date-desc");
                                }}
                            >
                                <span className="me-2">🔄</span> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-evenly align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Total Transaksi</h6>
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
                            <div className="d-flex justify-content-evenly align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Total Barang</h6>
                                    <h3 className="mb-0">{stats.totalItems}</h3>
                                </div>
                                <div className="bg-success bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">📦</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info bg-opacity-10 border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-evenly align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Jenis Barang</h6>
                                    <h3 className="mb-0">{stats.uniqueProducts}</h3>
                                </div>
                                <div className="bg-info bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">🏷️</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Daftar Barang Masuk</h5>
                        <span className="badge bg-primary">
                            {filteredItems.length} transaksi
                        </span>
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
                                        <th scope="col">ID Transaksi</th>
                                        <th scope="col">Tipe</th>
                                        <th scope="col">Jumlah</th>
                                        <th scope="col">Bukti Foto</th>
                                        <th scope="col">Tanggal</th>
                                        <th scope="col" className="text-end pe-4">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="ps-4">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-light rounded p-2 me-3">
                                                            <span className="fs-4">
                                                                {item.stuff?.type === "LAB"
                                                                    ? "💻"
                                                                    : item.stuff?.type === "HTL/KLN"
                                                                        ? "🏨"
                                                                        : "🔧"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0">
                                                                {item.stuff?.name || "N/A"}
                                                            </h6>
                                                            <small className="text-muted">
                                                                ID: {item.stuff?.id?.substring(0, 8) || "N/A"}
                                                                ...
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {item.id?.substring(0, 8) || "N/A"}...
                                                    </small>
                                                </td>
                                                <td>{item.stuff?.type || "N/A"}</td>
                                                <td>
                                                    <span className="badge bg-success">
                                                        {item.total || 0} unit
                                                    </span>
                                                </td>
                                                <td>
                                                    {item.proof_file ? (
                                                        <div
                                                            className="cursor-pointer"
                                                            onClick={() => handleImageClick(item.proof_file)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <img
                                                                src={item.proof_file || "/placeholder.svg"}
                                                                alt="Bukti foto"
                                                                className="img-thumbnail"
                                                                style={{
                                                                    width: "60px",
                                                                    height: "60px",
                                                                    objectFit: "cover",
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="badge bg-secondary">
                                                            Tidak ada foto
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {item.date_time
                                                        ? new Date(item.date_time).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            }
                                                        )
                                                        : new Date(item.created_at).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                </td>
                                                <td className="text-end pe-4">
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteClick(item)}
                                                    >
                                                        <span className="me-1">🗑️</span> Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                {searchQuery ? (
                                                    <div>
                                                        <p className="mb-0">
                                                            Tidak ada data yang sesuai dengan pencarian
                                                        </p>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary mt-2"
                                                            onClick={() => {
                                                                setSearchQuery("");
                                                            }}
                                                        >
                                                            Reset Pencarian
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="mb-0">Belum ada data barang masuk</p>
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
                                    Menampilkan <strong>1-{filteredItems.length}</strong> dari{" "}
                                    <strong>{inboundItems.length}</strong> transaksi
                                </p>
                            </div>
                            <div className="col-md-6">
                                <nav aria-label="Page navigation">
                                    <ul className="pagination justify-content-md-end mb-0">
                                        <li className="page-item disabled">
                                            <a
                                                className="page-link"
                                                href="#"
                                                tabIndex="-1"
                                                aria-disabled="true"
                                            >
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

            <Modal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                title="Bukti Foto"
            >
                <div className="text-center">
                    <img
                        src={selectedImage || "/placeholder.svg"}
                        alt="Bukti foto"
                        className="img-fluid rounded"
                        style={{ maxHeight: "70vh" }}
                    />
                    <div className="mt-3">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setIsImageModalOpen(false)}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Data"
            >
                <div>
                    <div className="alert alert-danger">
                        <p className="mb-0">
                            Apakah Anda yakin ingin menghapus data barang masuk{" "}
                            <strong>{selectedItem?.stuff?.name || "ini"}</strong>?
                        </p>
                        <p className="mb-0 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                        <button
                            type="button"
                            className="btn btn-outline-secondary me-2"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleDelete}
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
