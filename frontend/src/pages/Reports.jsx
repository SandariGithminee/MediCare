import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Users, FlaskConical, Pill, Calendar, Printer, FileSpreadsheet } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get("/reports/summary");
            setData(res.data);
        } catch (error) {
            toast.error("Failed to load reports summary");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const { summary, revenueByCategory, lowStockMedicines } = data || {};

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-gray-500">Comprehensive hospital operational summaries, revenue, and inventory insights.</p>
                </div>
                <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 w-fit">
                    <Printer size={18} /> Print Analytics Report
                </button>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card border-l-4 border-l-primary-500">
                    <p className="text-xs text-gray-400 font-semibold uppercase">Total Revenue Paid</p>
                    <h2 className="text-2xl font-extrabold text-primary-700 mt-1">LKR {summary?.totalRevenue?.toLocaleString()}</h2>
                    <p className="text-xs text-gray-400 mt-1">Pending: LKR {summary?.totalPendingRevenue?.toLocaleString()}</p>
                </div>

                <div className="card border-l-4 border-l-accent-500">
                    <p className="text-xs text-gray-400 font-semibold uppercase">Total Registered Patients</p>
                    <h2 className="text-2xl font-extrabold text-accent-700 mt-1">{summary?.totalPatients}</h2>
                    <p className="text-xs text-gray-400 mt-1">Across all departments</p>
                </div>

                <div className="card border-l-4 border-l-emerald-500">
                    <p className="text-xs text-gray-400 font-semibold uppercase">Lab Tests Processed</p>
                    <h2 className="text-2xl font-extrabold text-emerald-700 mt-1">{summary?.totalLabTests}</h2>
                    <p className="text-xs text-gray-400 mt-1">Pending: {summary?.pendingLabTests}</p>
                </div>

                <div className="card border-l-4 border-l-coral-500">
                    <p className="text-xs text-gray-400 font-semibold uppercase">Pharmacy Inventory</p>
                    <h2 className="text-2xl font-extrabold text-coral-700 mt-1">{summary?.totalMedicines} Items</h2>
                    <p className="text-xs font-semibold text-amber-600 mt-1">{summary?.lowStockCount} items require reorder</p>
                </div>
            </div>

            {/* Breakdown Section */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown by Category */}
                <div className="card space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-primary-600" size={20} /> Revenue Breakdown by Service Category
                    </h3>
                    <div className="space-y-3 pt-2">
                        {Object.entries(revenueByCategory || {}).map(([cat, amt]) => {
                            const pct = summary?.totalRevenue ? Math.round((amt / summary.totalRevenue) * 100) : 0;
                            return (
                                <div key={cat} className="space-y-1">
                                    <div className="flex justify-between text-sm font-semibold text-gray-700">
                                        <span>{cat} Services</span>
                                        <span>LKR {amt.toLocaleString()} ({pct}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Low Stock Warning Summary */}
                <div className="card space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Pill className="text-coral-600" size={20} /> Low Stock Inventory Alert Summary
                    </h3>
                    <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                        {lowStockMedicines?.map((m) => (
                            <div key={m._id} className="py-2.5 flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-bold text-gray-800">{m.name}</p>
                                    <p className="text-xs text-gray-400">Batch: {m.batchNumber} · Min Level: {m.minStockLevel}</p>
                                </div>
                                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full font-bold text-xs">
                                    {m.quantityInStock} in stock
                                </span>
                            </div>
                        ))}
                        {!lowStockMedicines?.length && (
                            <p className="text-gray-400 text-center py-8">All medicines are at healthy stock levels.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
