"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import ReactApexChart from "react-apexcharts"
import { API_URL } from "../../../constant"

export default function StaffDashboard() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [dashboardData, setDashboardData] = useState({
        stuffs: [],
        lendings: [],
        restorations: [],
    })
    const [timeRange, setTimeRange] = useState("week") // week, month, year
    const navigate = useNavigate()

    // Fetch all required data
    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch all data in parallel
            const [stuffsRes, lendingsRes, restorationsRes] = await Promise.all([
                axios.get(`${API_URL}/stuffs`),
                axios.get(`${API_URL}/lendings`),
                axios.get(`${API_URL}/restorations`),
            ])

            setDashboardData({
                stuffs: stuffsRes.data.data || [],
                lendings: lendingsRes.data.data || [],
                restorations: restorationsRes.data.data || [],
            })
            setError(null)
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem("access_token")
                localStorage.removeItem("user")
                navigate("/login", { replace: true })
            } else {
                setError("Terjadi kesalahan saat mengambil data dashboard")
                console.error("Dashboard data fetch error:", error)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [navigate])

    // Calculate summary statistics
    const stats = {
        totalItems: dashboardData.stuffs.length,
        availableItems: dashboardData.stuffs.filter((item) => item.stuff_stock && item.stuff_stock.total_available > 0)
            .length,
        totalLendings: dashboardData.lendings.length,
        activeBorrowings: dashboardData.lendings.filter((lending) => !lending.restoration).length,
        completedBorrowings: dashboardData.lendings.filter((lending) => lending.restoration).length,
        totalBorrowedItems: dashboardData.lendings.reduce((sum, lending) => sum + (Number(lending.total_stuff) || 0), 0),
        totalReturnedItems: dashboardData.restorations.reduce(
            (sum, restoration) =>
                sum + (Number(restoration.total_good_stuff) || 0) + (Number(restoration.total_defec_stuff) || 0),
            0,
        ),
        totalDamagedItems: dashboardData.restorations.reduce(
            (sum, restoration) => sum + (Number(restoration.total_defec_stuff) || 0),
            0,
        ),
    }

    // Get data for lending vs return chart
    const lendingVsReturnData = () => {
        // Filter data based on selected time range
        const now = new Date()
        const filteredLendings = dashboardData.lendings.filter((item) => {
            const itemDate = new Date(item.date_time || item.created_at)
            if (timeRange === "week") {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                return itemDate >= oneWeekAgo
            } else if (timeRange === "month") {
                const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                return itemDate >= oneMonthAgo
            } else if (timeRange === "year") {
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                return itemDate >= oneYearAgo
            }
            return true
        })

        const filteredRestorations = dashboardData.restorations.filter((item) => {
            const itemDate = new Date(item.date_time || item.created_at)
            if (timeRange === "week") {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                return itemDate >= oneWeekAgo
            } else if (timeRange === "month") {
                const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                return itemDate >= oneMonthAgo
            } else if (timeRange === "year") {
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                return itemDate >= oneYearAgo
            }
            return true
        })

        // Group by date
        const lendingsByDate = {}
        const returnsByDate = {}

        filteredLendings.forEach((item) => {
            const date = new Date(item.date_time || item.created_at)
            let dateKey

            if (timeRange === "week") {
                dateKey = date.toLocaleDateString("id-ID", { weekday: "short" })
            } else if (timeRange === "month") {
                dateKey = date.toLocaleDateString("id-ID", { day: "numeric" })
            } else {
                dateKey = date.toLocaleDateString("id-ID", { month: "short" })
            }

            if (!lendingsByDate[dateKey]) {
                lendingsByDate[dateKey] = 0
            }
            lendingsByDate[dateKey] += Number(item.total_stuff) || 0
        })

        filteredRestorations.forEach((item) => {
            const date = new Date(item.date_time || item.created_at)
            let dateKey

            if (timeRange === "week") {
                dateKey = date.toLocaleDateString("id-ID", { weekday: "short" })
            } else if (timeRange === "month") {
                dateKey = date.toLocaleDateString("id-ID", { day: "numeric" })
            } else {
                dateKey = date.toLocaleDateString("id-ID", { month: "short" })
            }

            if (!returnsByDate[dateKey]) {
                returnsByDate[dateKey] = 0
            }
            returnsByDate[dateKey] += (Number(item.total_good_stuff) || 0) + (Number(item.total_defec_stuff) || 0)
        })

        // Get all unique dates
        const allDates = [...new Set([...Object.keys(lendingsByDate), ...Object.keys(returnsByDate)])]

        // Sort dates
        const sortedDates = allDates.sort((a, b) => {
            if (timeRange === "week") {
                const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
                return days.indexOf(a) - days.indexOf(b)
            }
            return a.localeCompare(b)
        })

        return {
            series: [
                {
                    name: "Peminjaman",
                    data: sortedDates.map((date) => lendingsByDate[date] || 0),
                },
                {
                    name: "Pengembalian",
                    data: sortedDates.map((date) => returnsByDate[date] || 0),
                },
            ],
            options: {
                chart: {
                    type: "line",
                    height: 350,
                    toolbar: {
                        show: false,
                    },
                },
                stroke: {
                    curve: "smooth",
                    width: 3,
                },
                xaxis: {
                    categories: sortedDates,
                },
                yaxis: {
                    title: {
                        text: "Jumlah Barang",
                    },
                },
                tooltip: {
                    y: {
                        formatter: (val) => val + " unit",
                    },
                },
                colors: ["#3b82f6", "#10b981"],
                legend: {
                    position: "top",
                },
                markers: {
                    size: 5,
                },
            },
        }
    }

    // Get data for lending status chart
    const lendingStatusData = () => {
        return {
            series: [stats.activeBorrowings, stats.completedBorrowings],
            options: {
                chart: {
                    type: "donut",
                },
                labels: ["Sedang Dipinjam", "Sudah Dikembalikan"],
                colors: ["#f59e0b", "#10b981"],
                responsive: [
                    {
                        breakpoint: 480,
                        options: {
                            chart: {
                                width: 200,
                            },
                            legend: {
                                position: "bottom",
                            },
                        },
                    },
                ],
                plotOptions: {
                    pie: {
                        donut: {
                            size: "65%",
                            labels: {
                                show: true,
                                total: {
                                    show: true,
                                    showAlways: true,
                                    label: "Total Peminjaman",
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    color: "#373d3f",
                                    formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0),
                                },
                            },
                        },
                    },
                },
            },
        }
    }

    // Get data for return quality chart
    const returnQualityData = () => {
        const goodItems = dashboardData.restorations.reduce(
            (sum, restoration) => sum + (Number(restoration.total_good_stuff) || 0),
            0,
        )

        const defectiveItems = dashboardData.restorations.reduce(
            (sum, restoration) => sum + (Number(restoration.total_defec_stuff) || 0),
            0,
        )

        return {
            series: [goodItems, defectiveItems],
            options: {
                chart: {
                    type: "pie",
                },
                labels: ["Barang Baik", "Barang Rusak"],
                colors: ["#10b981", "#ef4444"],
                responsive: [
                    {
                        breakpoint: 480,
                        options: {
                            chart: {
                                width: 200,
                            },
                            legend: {
                                position: "bottom",
                            },
                        },
                    },
                ],
                plotOptions: {
                    pie: {
                        dataLabels: {
                            offset: -5,
                        },
                    },
                },
            },
        }
    }

    // Get recent lendings
    const recentLendings = dashboardData.lendings
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

    // Get recent returns
    const recentReturns = dashboardData.restorations
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((restoration) => {
            // Find the corresponding lending
            const lending = dashboardData.lendings.find((l) => l.id === restoration.lending_id)
            return { ...restoration, lending }
        })

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    if (loading) {
        return (
            <div className="container-fluid py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Memuat data dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <h2 className="mb-0">Dashboard Staff</h2>
                    <p className="text-muted">Ringkasan data peminjaman dan pengembalian</p>
                </div>
                <div className="col-md-6 text-md-end">
                    <div className="btn-group">
                        <button
                            className={`btn ${timeRange === "week" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setTimeRange("week")}
                        >
                            Minggu Ini
                        </button>
                        <button
                            className={`btn ${timeRange === "month" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setTimeRange("month")}
                        >
                            Bulan Ini
                        </button>
                        <button
                            className={`btn ${timeRange === "year" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setTimeRange("year")}
                        >
                            Tahun Ini
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary bg-opacity-10 border-0 h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Total Peminjaman</h6>
                                    <h3 className="mb-0">{stats.totalLendings}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">📋</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning bg-opacity-10 border-0 h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Sedang Dipinjam</h6>
                                    <h3 className="mb-0">{stats.activeBorrowings}</h3>
                                </div>
                                <div className="bg-warning bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">⏳</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success bg-opacity-10 border-0 h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Sudah Dikembalikan</h6>
                                    <h3 className="mb-0">{stats.completedBorrowings}</h3>
                                </div>
                                <div className="bg-success bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">✅</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-danger bg-opacity-10 border-0 h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Barang Rusak</h6>
                                    <h3 className="mb-0">{stats.totalDamagedItems}</h3>
                                </div>
                                <div className="bg-danger bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">❗</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="row g-4 mb-4">
                {/* Lending vs Return Chart */}
                <div className="col-md-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Peminjaman vs Pengembalian</h5>
                        </div>
                        <div className="card-body">
                            {dashboardData.lendings.length > 0 ? (
                                <ReactApexChart
                                    options={lendingVsReturnData().options}
                                    series={lendingVsReturnData().series}
                                    type="line"
                                    height={350}
                                />
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data peminjaman</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lending Status Chart */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Status Peminjaman</h5>
                        </div>
                        <div className="card-body">
                            {dashboardData.lendings.length > 0 ? (
                                <ReactApexChart
                                    options={lendingStatusData().options}
                                    series={lendingStatusData().series}
                                    type="donut"
                                    height={350}
                                />
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data peminjaman</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row of Charts and Tables */}
            <div className="row g-4 mb-4">
                {/* Return Quality Chart */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Kualitas Pengembalian</h5>
                        </div>
                        <div className="card-body">
                            {dashboardData.restorations.length > 0 ? (
                                <ReactApexChart
                                    options={returnQualityData().options}
                                    series={returnQualityData().series}
                                    type="pie"
                                    height={300}
                                />
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data pengembalian</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Returns */}
                <div className="col-md-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Pengembalian Terbaru</h5>
                            <a href="/staff/lendings" className="btn btn-sm btn-outline-primary">
                                Lihat Semua
                            </a>
                        </div>
                        <div className="card-body p-0">
                            {recentReturns.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th scope="col" className="ps-4">
                                                    Nama Barang
                                                </th>
                                                <th scope="col">Peminjam</th>
                                                <th scope="col">Barang Baik</th>
                                                <th scope="col">Barang Rusak</th>
                                                <th scope="col">Tanggal Kembali</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentReturns.map((restoration) => (
                                                <tr key={restoration.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded p-2 me-3">
                                                                <span className="fs-5">
                                                                    {restoration.lending?.stuff?.type === "Lab"
                                                                        ? "💻"
                                                                        : restoration.lending?.stuff?.type === "HTL/KLN"
                                                                            ? "🏨"
                                                                            : "🔧"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{restoration.lending?.stuff?.name || "N/A"}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{restoration.lending?.name || "N/A"}</td>
                                                    <td>
                                                        <span className="badge bg-success">{restoration.total_good_stuff || 0} unit</span>
                                                    </td>
                                                    <td>
                                                        {Number(restoration.total_defec_stuff) > 0 ? (
                                                            <span className="badge bg-danger">{restoration.total_defec_stuff} unit</span>
                                                        ) : (
                                                            <span className="badge bg-light text-dark">0 unit</span>
                                                        )}
                                                    </td>
                                                    <td>{formatDate(restoration.date_time || restoration.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data pengembalian</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Lendings */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Peminjaman Terbaru</h5>
                            <a href="/staff/lendings" className="btn btn-sm btn-outline-primary">
                                Lihat Semua
                            </a>
                        </div>
                        <div className="card-body p-0">
                            {recentLendings.length > 0 ? (
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentLendings.map((lending) => {
                                                const isReturned = !!lending.restoration
                                                return (
                                                    <tr key={lending.id}>
                                                        <td className="ps-4">
                                                            <div className="d-flex align-items-center">
                                                                <div className="bg-light rounded p-2 me-3">
                                                                    <span className="fs-5">
                                                                        {lending.stuff?.type === "Lab"
                                                                            ? "💻"
                                                                            : lending.stuff?.type === "HTL/KLN"
                                                                                ? "🏨"
                                                                                : "🔧"}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-0">{lending.stuff?.name || "N/A"}</h6>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{lending.name}</td>
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
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data peminjaman</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Borrowings Alert */}
            {stats.activeBorrowings > 0 && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card bg-warning bg-opacity-10 border-0">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center">
                                    <div className="bg-warning bg-opacity-25 p-3 rounded me-3">
                                        <span className="fs-4">⏳</span>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="text-warning mb-1">Peminjaman Aktif</h5>
                                        <p className="mb-0">
                                            Terdapat <strong>{stats.activeBorrowings} peminjaman</strong> yang masih aktif. Pastikan untuk
                                            mengingatkan peminjam untuk mengembalikan barang tepat waktu.
                                        </p>
                                    </div>
                                    <a href="/staff/lendings" className="btn btn-warning">
                                        Lihat Peminjaman
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
