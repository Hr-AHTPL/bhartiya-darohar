/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { FileText, Search, Trash2, Loader2, Receipt } from "lucide-react";
import API_BASE_URL from "@/config/api.config";

interface ConsultationBill {
  _id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientIdno: string;
  billNumber: string;
  billDate: string;
  consultationAmount: number;
  discountPercentage: number;
  discountApprovedBy: string;
  receivedAmount: number;
  balance: number;
  visitDate: string;
  appointment: string;
}

interface ConsultationBillHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function ConsultationBillHistory({
  isOpen,
  onClose,
}: ConsultationBillHistoryProps) {
  const [bills, setBills] = useState<ConsultationBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<ConsultationBill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userRole =
    typeof window !== "undefined"
      ? localStorage.getItem("userRole") || ""
      : "";
  const isAdmin = userRole === "admin";

  // ── Fetch all consultation bills ────────────────────────────────────
  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/consultation-bills`,
        {
          headers: {
            Authorization: token || "",
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch consultation bills");
      const data = await response.json();
      if (data.success) {
        setBills(data.bills);
        setFilteredBills(data.bills);
      } else {
        throw new Error(data.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBills();
      setSearchTerm("");
      setCurrentPage(1);
    }
  }, [isOpen, fetchBills]);

  // ── Search filter ────────────────────────────────────────────────────
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      setFilteredBills(bills);
    } else {
      setFilteredBills(
        bills.filter(
          (b) =>
            b.patientName?.toLowerCase().includes(q) ||
            b.billNumber?.toLowerCase().includes(q) ||
            b.patientIdno?.toLowerCase().includes(q) ||
            b.patientId?.toLowerCase().includes(q)
        )
      );
    }
    setCurrentPage(1);
  }, [searchTerm, bills]);

  // ── Delete (admin only) ──────────────────────────────────────────────
  const handleDelete = async (bill: ConsultationBill) => {
    if (
      !window.confirm(
        `Delete consultation bill ${bill.billNumber} for ${bill.patientName}?\n\nThis action cannot be undone.`
      )
    )
      return;

    setDeletingId(bill._id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/website/enquiry/consultation-bills/${bill.visitId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token || "",
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setBills((prev) => prev.filter((b) => b._id !== bill._id));
      } else {
        alert(data.message || "Failed to delete bill");
      }
    } catch {
      alert("Error deleting bill. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Pagination ───────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBills = filteredBills.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const max = 5;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ── Summary stats (use receivedAmount = actual amount after discount) ──
  const todayStr = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY
  const todayTotal = bills
    .filter((b) => b.billDate === todayStr)
    .reduce((sum, b) => sum + (b.receivedAmount || 0), 0);

  const monthlyTotal = (() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return bills
      .filter((b) => {
        if (!b.billDate) return false;
        const parts = b.billDate.split("/");
        return parts[1] === mm && parts[2] === String(yyyy);
      })
      .reduce((sum, b) => sum + (b.receivedAmount || 0), 0);
  })();

  const overallTotal = bills.reduce(
    (sum, b) => sum + (b.receivedAmount || 0),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-orange-700 via-red-700 to-amber-700 bg-clip-text text-transparent">
            <Receipt className="h-6 w-6 text-orange-600" />
            Consultation Bill History
          </DialogTitle>
        </DialogHeader>

        {/* ── Summary Cards ── */}
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            {
              label: "Today's Consultations",
              value: todayTotal,
              color: "from-orange-100 to-orange-200 border-orange-300 text-orange-800",
            },
            {
              label: "Monthly Consultations",
              value: monthlyTotal,
              color: "from-amber-100 to-amber-200 border-amber-300 text-amber-800",
            },
            {
              label: "Total Consultations",
              value: overallTotal,
              color: "from-red-100 to-red-200 border-red-300 text-red-800",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`flex-1 min-w-[140px] bg-gradient-to-r ${card.color} border-2 rounded-2xl px-4 py-3 shadow`}
            >
              <p className={`text-xs font-bold uppercase tracking-wide`}>
                {card.label}
              </p>
              <p className="text-xl font-extrabold mt-1">
                ₹{card.value.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search Bar ── */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by patient name, patient ID or bill number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-orange-200 focus:border-orange-500 rounded-xl"
          />
        </div>

        {/* ── Count Info ── */}
        {!isLoading && !error && filteredBills.length > 0 && (
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>
              Showing {startIdx + 1}–
              {Math.min(startIdx + ITEMS_PER_PAGE, filteredBills.length)} of{" "}
              {filteredBills.length} bills
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-orange-600 font-semibold">
              Loading bills...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-semibold mb-3">{error}</p>
            <Button
              onClick={fetchBills}
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Retry
            </Button>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <FileText className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-orange-900 mb-1">
              {searchTerm ? "No matching bills" : "No consultation bills yet"}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "Try a different search term."
                : "Bills will appear here after consultations are billed."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-orange-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <TableHead className="font-bold text-orange-800">
                      Bill No.
                    </TableHead>
                    <TableHead className="font-bold text-orange-800">
                      Bill Date
                    </TableHead>
                    <TableHead className="font-bold text-orange-800">
                      Patient ID
                    </TableHead>
                    <TableHead className="font-bold text-orange-800">
                      Patient Name
                    </TableHead>
                    <TableHead className="font-bold text-orange-800">
                      Doctor
                    </TableHead>
                    <TableHead className="font-bold text-orange-800 text-right">
                      Amount (₹)
                    </TableHead>
                    <TableHead className="font-bold text-orange-800 text-right">
                      Discount
                    </TableHead>
                    <TableHead className="font-bold text-orange-800 text-right">
                      Received (₹)
                    </TableHead>
                    <TableHead className="font-bold text-orange-800 text-right">
                      Balance (₹)
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="font-bold text-orange-800 text-center">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBills.map((bill) => (
                    <TableRow
                      key={bill._id}
                      className="hover:bg-orange-50/50 transition-colors"
                    >
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-700">
                          {bill.billNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-medium">
                        {bill.billDate || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-700">
                        {bill.patientIdno || bill.patientId || "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-800">
                        {bill.patientName || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {bill.appointment || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-700">
                        ₹{(bill.consultationAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-500 font-semibold">
                        {bill.discountPercentage
                          ? `${bill.discountPercentage}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-700">
                        ₹{(bill.receivedAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span
                          className={
                            (bill.balance || 0) > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          ₹{(bill.balance || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(bill)}
                            disabled={deletingId === bill._id}
                            className="border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Bill (Admin Only)"
                          >
                            {deletingId === bill._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer hover:bg-orange-50"
                      }
                    />
                  </PaginationItem>

                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(1)}
                          className="cursor-pointer hover:bg-orange-50"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {getPageNumbers().map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => setCurrentPage(p)}
                        isActive={currentPage === p}
                        className={`cursor-pointer ${
                          currentPage === p
                            ? "bg-orange-500 text-white"
                            : "hover:bg-orange-50"
                        }`}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer hover:bg-orange-50"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer hover:bg-orange-50"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}

        {/* ── Admin note ── */}
        {!isAdmin && bills.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-center italic">
            Delete access is restricted to admins only.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}