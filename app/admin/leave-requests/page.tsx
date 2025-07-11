"use client"

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface LeaveRequest {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  leaveType: {
    name: string;
  };
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason: string;
  createdAt: string;
}

export default function AdminLeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth-token");
      const res = await fetch("/api/leave-requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch leave requests");
      const data = await res.json();
      setLeaveRequests(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id + action);
    setError(null);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch(`/api/leave-requests/${id}/${action}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed to ${action} request`);
      }
      await fetchLeaveRequests();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 text-blue-900 border-b border-border flex items-center px-6 py-4 mb-6 shadow-lg animate-fade-in rounded-b-xl">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4 text-blue-900 hover:bg-blue-100/40">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-blue-900">Admin Leave Requests</h1>
      </div>
      <main className="p-8">
        {loading ? (
          <p className="text-blue-900">Loading leave requests...</p>
        ) : error ? (
          <p className="text-purple-700">Error: {error}</p>
        ) : leaveRequests.length === 0 ? (
          <p className="text-blue-900">No leave requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-0 rounded-xl bg-white/80 shadow-lg animate-fade-in-up">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-4 py-2 border-b text-left text-blue-900">Employee</th>
                  <th className="px-4 py-2 border-b text-left text-blue-900">Leave Type</th>
                  <th className="px-4 py-2 border-b text-left text-blue-900">Start Date</th>
                  <th className="px-4 py-2 border-b text-left text-blue-900">End Date</th>
                  <th className="px-4 py-2 border-b text-left text-blue-900">Days</th>
                  <th className="px-4 py-2 border-b text-left text-blue-900">Status</th>
                  <th className="px-4 py-2 border-b text-left text-blue-900">Reason</th>
                  <th className="px-4 py-2 border-b text-left text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr key={req.id} className="border-b last:border-b-0 hover:bg-blue-50/40 transition-colors animate-fade-in-up">
                    <td className="px-4 py-2 align-top">
                      <div className="font-medium text-blue-900">
                        {req.employee.firstName} {req.employee.lastName}
                      </div>
                      <div className="text-xs text-purple-500">ID: {req.employee.employeeId}</div>
                    </td>
                    <td className="px-4 py-2 align-top text-purple-700">{req.leaveType.name}</td>
                    <td className="px-4 py-2 align-top text-blue-700">{new Date(req.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 align-top text-blue-700">{new Date(req.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 align-top text-teal-700">{req.totalDays}</td>
                    <td className={cn(
                      "px-4 py-2 align-top font-semibold",
                      req.status === "PENDING" && "text-purple-600",
                      req.status === "APPROVED" && "text-teal-600",
                      req.status === "REJECTED" && "text-blue-600"
                    )}>{req.status}</td>
                    <td className="px-4 py-2 align-top max-w-xs break-words text-blue-900">{req.reason}</td>
                    <td className="px-4 py-2 align-top">
                      <Button
                        onClick={() => handleAction(req.id, "approve")}
                        disabled={actionLoading !== null || req.status !== "PENDING"}
                        variant="gradient2"
                        className={cn(
                          "mr-2 px-3 py-1 rounded text-white font-medium transition hover:scale-105",
                          actionLoading && actionLoading === req.id + "approve" && "opacity-70"
                        )}
                      >
                        {actionLoading === req.id + "approve" ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        onClick={() => handleAction(req.id, "reject")}
                        disabled={actionLoading !== null || req.status !== "PENDING"}
                        variant="gradient3"
                        className={cn(
                          "px-3 py-1 rounded text-white font-medium transition hover:scale-105",
                          actionLoading && actionLoading === req.id + "reject" && "opacity-70"
                        )}
                      >
                        {actionLoading === req.id + "reject" ? "Rejecting..." : "Reject"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
} 