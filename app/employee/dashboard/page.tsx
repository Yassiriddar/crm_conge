"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

function LeaveRequestDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [leaveTypeId, setLeaveTypeId] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchLeaveTypes()
    }
  }, [open])

  const fetchLeaveTypes = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const res = await fetch("/api/leave-types", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLeaveTypes(data)
    } catch (err) {
      setLeaveTypes([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("auth-token")
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveTypeId,
          startDate,
          endDate,
          reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit leave request")
      }
      toast.success("Leave request submitted!")
      onOpenChange(false)
      onSuccess()
      setLeaveTypeId("")
      setStartDate(undefined)
      setEndDate(undefined)
      setReason("")
    } catch (err: any) {
      setError(err.message || "Failed to submit leave request")
      toast.error(err.message || "Failed to submit leave request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/80 border-0 rounded-xl shadow-2xl animate-fade-in-up">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Request Leave</DialogTitle>
          <DialogDescription className="text-blue-500">Submit a new leave request</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-700">Leave Type *</label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
              <SelectTrigger className="bg-blue-50 border-blue-200 text-blue-900">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="text-blue-900">{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-700">Start Date *</label>
              <Input
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                required
                className="bg-blue-50 border-blue-200 text-blue-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-700">End Date *</label>
              <Input
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                required
                className="bg-blue-50 border-blue-200 text-blue-900"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-700">Reason *</label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} placeholder="Reason for leave" className="bg-blue-50 border-blue-200 text-blue-900" />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="text-blue-900 hover:bg-blue-100/40">Cancel</Button>
            <Button type="submit" disabled={loading || !leaveTypeId || !startDate || !endDate || !reason} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-colors">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function EmployeeDashboard() {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchEmployeeData()
  }, [])

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      // Fetch employee's leave requests
      const requestsRes = await fetch("/api/leave-requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const requests = await requestsRes.json()
      setLeaveRequests(requests)
      // Fetch leave balances
      const balancesRes = await fetch("/api/leave-balances", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (balancesRes.ok) {
        const balances = await balancesRes.json()
        setLeaveBalances(balances)
      }
    } catch (error) {
      console.error("Error fetching employee data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 text-blue-900 border-b border-border flex items-center px-6 py-4 mb-6 shadow-lg animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4 text-blue-900 hover:bg-blue-100/40">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-blue-900">My Dashboard</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <span />
          <Button variant="gradient" className="hover:scale-105 transition-transform" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        </div>
        <LeaveRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchEmployeeData} />
        {/* Leave Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaveBalances.map((balance: any) => (
            <Card key={balance.id} className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">{balance.leaveType.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-500">Allocated:</span>
                    <span className="font-medium text-blue-900">{balance.allocated} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-500">Used:</span>
                    <span className="font-medium text-purple-900">{balance.used} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-teal-500">Remaining:</span>
                    <span className="font-bold text-teal-900">{balance.remaining} days</span>
                  </div>
                  {balance.carriedOver > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-500">Carried Over:</span>
                      <span className="font-medium text-blue-900">{balance.carriedOver} days</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Recent Leave Requests */}
        <Card className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-700">My Leave Requests</CardTitle>
            <CardDescription className="text-blue-500">Your recent leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 via-purple-50 to-teal-50 animate-fade-in-up shadow-md">
                  <div className="flex-1">
                    <div className="font-medium text-lg text-blue-900">{request.leaveType.name}</div>
                    <div className="text-sm text-blue-700">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-blue-700">
                      {request.totalDays} days • {request.reason}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-3 py-1 rounded text-white font-medium transition",
                      request.status === "PENDING" && "bg-purple-500",
                      request.status === "APPROVED" && "bg-teal-500",
                      request.status === "REJECTED" && "bg-blue-500"
                    )}>{request.status}</span>
                    <div className="text-sm text-blue-500">{new Date(request.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">No leave requests found. Click "Request Leave" to create your first request.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
