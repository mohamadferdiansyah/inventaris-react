"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import ReactApexChart from "react-apexcharts"
import { API_URL } from "../../../constant"

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [dashboardData, setDashboardData] = useState({
        stuffs: [],
        inboundItems: [],
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
            const [stuffsRes, inboundRes, lendingsRes, restorationsRes] = await Promise.all([
                axios.get(`${API_URL}/stuffs`),
                axios.get(`${API_URL}/inbound-stuffs`),
                axios.get(`${API_URL}/lendings`),
                axios.get(`${API_URL}/restorations`),
            ])

            setDashboardData({
                stuffs: stuffsRes.data.data || [],
                inboundItems: inboundRes.data.data || [],
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
        availableItems: dashboardData.stuffs.filter(
            (item) => item.stuff_stock && item.stuff_stock.total_available > 0
        ).length,
        lowStockItems: dashboardData.stuffs.filter(
            (item) =>
                item.stuff_stock &&
                item.stuff_stock.total_available > 0 &&
                item.stuff_stock.total_available <= 5
        ).length,
        outOfStockItems: dashboardData.stuffs.filter(
            (item) => !item.stuff_stock || item.stuff_stock.total_available === 0
        ).length,
        totalInbound: dashboardData.inboundItems.length,
        totalInboundQuantity: dashboardData.inboundItems.reduce(
            (sum, item) => sum + (Number(item.total) || 0), 0
        ),
        activeBorrowings: dashboardData.lendings.filter(
            (lending) => !lending.restoration
        ).length,
        completedBorrowings: dashboardData.lendings.filter(
            (lending) => lending.restoration
        ).length,
    }

    // Get data for inventory by type chart
    const inventoryByTypeData = () => {
        const typeCount = {}
        dashboardData.stuffs.forEach(item => {
            typeCount[item.type] = (typeCount[item.type] || 0) + 1
        })

        return {
            series: Object.values(typeCount),
            options: {
                chart: {
                    type: 'pie',
                },
                labels: Object.keys(typeCount),
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }],
                colors: ['#4ade80', '#f87171', '#60a5fa', '#c084fc', '#fbbf24']
            }
        }
    }

    // Get data for inbound items over time chart
    const inboundOverTimeData = () => {
        // Filter data based on selected time range
        const now = new Date()
        const filteredData = dashboardData.inboundItems.filter(item => {
            const itemDate = new Date(item.date_time || item.created_at)
            if (timeRange === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                return itemDate >= oneWeekAgo
            } else if (timeRange === 'month') {
                const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                return itemDate >= oneMonthAgo
            } else if (timeRange === 'year') {
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                return itemDate >= oneYearAgo
            }
            return true
        })

        // Group by date
        const groupedByDate = {}
        filteredData.forEach(item => {
            const date = new Date(item.date_time || item.created_at)
            let dateKey

            if (timeRange === 'week') {
                dateKey = date.toLocaleDateString('id-ID', { weekday: 'short' })
            } else if (timeRange === 'month') {
                dateKey = date.toLocaleDateString('id-ID', { day: 'numeric' })
            } else {
                dateKey = date.toLocaleDateString('id-ID', { month: 'short' })
            }

            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = 0
            }
            groupedByDate[dateKey] += Number(item.total) || 0
        })

        // Sort dates
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
            if (timeRange === 'week') {
                const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
                return days.indexOf(a) - days.indexOf(b)
            }
            return a.localeCompare(b)
        })

        return {
            series: [{
                name: 'Jumlah Barang Masuk',
                data: sortedDates.map(date => groupedByDate[date])
            }],
            options: {
                chart: {
                    type: 'bar',
                    height: 350,
                    toolbar: {
                        show: false
                    }
                },
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        columnWidth: '70%',
                    }
                },
                dataLabels: {
                    enabled: false
                },
                stroke: {
                    curve: 'smooth',
                    width: 2
                },
                xaxis: {
                    categories: sortedDates,
                },
                yaxis: {
                    title: {
                        text: 'Jumlah Barang'
                    }
                },
                fill: {
                    opacity: 1,
                    type: 'gradient',
                    gradient: {
                        shade: 'dark',
                        gradientToColors: ['#60a5fa'],
                        shadeIntensity: 1,
                        type: 'vertical',
                        opacityFrom: 0.9,
                        opacityTo: 0.6,
                    },
                },
                tooltip: {
                    y: {
                        formatter: function (val) {
                            return val + " unit"
                        }
                    }
                },
                colors: ['#3b82f6']
            }
        }
    }

    // Get data for stock status chart
    const stockStatusData = () => {
        return {
            series: [stats.availableItems, stats.lowStockItems, stats.outOfStockItems],
            options: {
                chart: {
                    type: 'donut',
                },
                labels: ['Tersedia', 'Stok Rendah', 'Habis'],
                colors: ['#4ade80', '#fbbf24', '#f87171'],
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }],
                plotOptions: {
                    pie: {
                        donut: {
                            size: '65%',
                            labels: {
                                show: true,
                                total: {
                                    show: true,
                                    showAlways: true,
                                    label: 'Total Barang',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#373d3f',
                                    formatter: function (w) {
                                        return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Get recent inbound items
    const recentInboundItems = dashboardData.inboundItems
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

    // Get recent lendings
    const recentLendings = dashboardData.lendings
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

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
                    <h2 className="mb-0">Dashboard Admin</h2>
                    <p className="text-muted">Ringkasan data inventaris dan aktivitas sistem</p>
                </div>
                <div className="col-md-6 text-md-end">
                    <div className="btn-group">
                        <button
                            className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setTimeRange('week')}
                        >
                            Minggu Ini
                        </button>
                        <button
                            className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setTimeRange('month')}
                        >
                            Bulan Ini
                        </button>
                        <button
                            className={`btn ${timeRange === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setTimeRange('year')}
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
                                    <h6 className="text-muted mb-1">Total Barang</h6>
                                    <h3 className="mb-0">{stats.totalItems}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">📦</span>
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
                                    <h6 className="text-muted mb-1">Barang Masuk</h6>
                                    <h3 className="mb-0">{stats.totalInboundQuantity}</h3>
                                    <small className="text-muted">{stats.totalInbound} transaksi</small>
                                </div>
                                <div className="bg-success bg-opacity-25 p-3 rounded">
                                    <span className="fs-4">📥</span>
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
                    <div className="card bg-danger bg-opacity-10 border-0 h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">Stok Habis</h6>
                                    <h3 className="mb-0">{stats.outOfStockItems}</h3>
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
                {/* Inbound Over Time Chart */}
                <div className="col-md-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Barang Masuk</h5>
                        </div>
                        <div className="card-body">
                            {dashboardData.inboundItems.length > 0 ? (
                                <ReactApexChart
                                    options={inboundOverTimeData().options}
                                    series={inboundOverTimeData().series}
                                    type="bar"
                                    height={350}
                                />
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data barang masuk</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Status Chart */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Status Stok</h5>
                        </div>
                        <div className="card-body">
                            {dashboardData.stuffs.length > 0 ? (
                                <ReactApexChart
                                    options={stockStatusData().options}
                                    series={stockStatusData().series}
                                    type="donut"
                                    height={350}
                                />
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data barang</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row of Charts and Tables */}
            <div className="row g-4 mb-4">
                {/* Inventory by Type Chart */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Barang Berdasarkan Tipe</h5>
                        </div>
                        <div className="card-body">
                            {dashboardData.stuffs.length > 0 ? (
                                <ReactApexChart
                                    options={inventoryByTypeData().options}
                                    series={inventoryByTypeData().series}
                                    type="pie"
                                    height={300}
                                />
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data barang</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Inbound Items */}
                <div className="col-md-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Barang Masuk Terbaru</h5>
                            <a href="/admin/inbounds" className="btn btn-sm btn-outline-primary">Lihat Semua</a>
                        </div>
                        <div className="card-body p-0">
                            {recentInboundItems.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th scope="col" className="ps-4">Nama Barang</th>
                                                <th scope="col">Jumlah</th>
                                                <th scope="col">Tanggal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentInboundItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded p-2 me-3">
                                                                <span className="fs-5">
                                                                    {item.stuff?.type === "LAB" ? "💻" : item.stuff?.type === "HTL/KLN" ? "🏨" : "🔧"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{item.stuff?.name || "N/A"}</h6>
                                                                <small className="text-muted">{item.stuff?.type || "N/A"}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-success">{item.total || 0} unit</span>
                                                    </td>
                                                    <td>{formatDate(item.date_time || item.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted mb-0">Belum ada data barang masuk</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {stats.lowStockItems > 0 && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card bg-warning bg-opacity-10 border-0">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center">
                                    <div className="bg-warning bg-opacity-25 p-3 rounded me-3">
                                        <span className="fs-4">⚠️</span>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="text-warning mb-1">Peringatan Stok Rendah</h5>
                                        <p className="mb-0">
                                            Terdapat <strong>{stats.lowStockItems} barang</strong> dengan stok rendah. Segera lakukan penambahan stok untuk menghindari kehabisan.
                                        </p>
                                    </div>
                                    <a href="/stuffs" className="btn btn-warning">Lihat Barang</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
