import React, { useEffect, useState } from "react";
import { ShieldCheck, Search, Clock, User, Terminal } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/audit-logs");
            setLogs(data);
        } catch (error) {
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter((l) => {
        const user = l.user ? l.user.toLowerCase() : "";
        const action = l.action ? l.action.toLowerCase() : "";
        const details = l.details ? l.details.toLowerCase() : "";
        const s = search.toLowerCase();
        return user.includes(s) || action.includes(s) || details.includes(s);
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Security Audit Logs</h1>
                <p className="text-gray-500">Track system actions, user authentications, and security event trails.</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    className="input-field pl-10"
                    placeholder="Search audit logs by user or action..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">User & Role</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-mono text-xs">
                                {filteredLogs.map((l) => (
                                    <tr key={l._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(l.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-sans font-semibold text-gray-800">
                                            {l.user} <span className="text-xs text-primary-600 font-normal">({l.role || "User"})</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-md font-bold">
                                                {l.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-sans text-gray-600">{l.details}</td>
                                        <td className="px-6 py-4 text-gray-400">{l.ipAddress || "127.0.0.1"}</td>
                                    </tr>
                                ))}
                                {!filteredLogs.length && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-400 font-sans">
                                            No audit log records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
