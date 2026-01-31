import React from "react";
import { ChevronLeft, ChevronRight, Loader2, Database } from "lucide-react";

const DataTable = ({
    columns,
    data,
    loading,
    renderRow,
    pagination,
    onPageChange,
    emptyText = "No records found",
}) => {
    return (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 backdrop-blur-sm text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold border-b border-slate-100">
                            {columns.map((col, index) => (
                                <th
                                    key={col}
                                    className={`px-6 py-5 ${index === columns.length - 1 ? "text-right" : ""
                                        }`}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-32 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 border-4 border-[#7a6af6]/20 border-t-[#7a6af6] rounded-full animate-spin" />
                                            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#7a6af6] animate-pulse" size={16} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] animate-pulse">
                                            Synchronizing Data...
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-32 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-40">
                                        <Database size={32} className="text-slate-300" />
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                            {emptyText}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => renderRow(item, index))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="px-6 py-4 border-t border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md mt-auto">
                    <div className="flex flex-col">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing <span className="text-[#0F172A]">{data.length}</span> entries
                        </p>
                        <p className="text-[9px] text-slate-300 font-medium uppercase tracking-tighter">
                            Total Records: {pagination.total}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1 || loading}
                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl disabled:opacity-30 border border-slate-100 transition-all hover:bg-white hover:text-[#7a6af6] hover:border-[#7a6af6]/20 active:scale-90"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#7a6af6] to-[#b2a9f9] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative h-9 w-9 flex items-center justify-center bg-[#0F172A] rounded-xl shadow-lg shadow-[#0F172A]/20">
                                <span className="text-[11px] font-black text-white">
                                    {pagination.page}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={
                                loading ||
                                data.length === 0 ||
                                pagination.page >= pagination.pages
                            }
                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl
             disabled:opacity-30 border border-slate-100
             transition-all hover:bg-white hover:text-[#7a6af6]
             hover:border-[#7a6af6]/20 active:scale-90"
                        >
                            <ChevronRight size={16} />
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;