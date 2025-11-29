/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePagination } from "@/hooks/usePagination";
import { PatientPagination } from "./PatientPagination";
import { useEffect } from "react";
import API_BASE_URL from "@/config/api.config";

interface PatientDisplaySectionProps {
  isLoading: boolean;
  error: any;
  filteredPatients: any[];
  activeFilter: string;
  loggedInDoctor: string | null;
  handlePrescriptionGenerated: () => void;
  PastHistoryDialog: any;
  PrescriptionForm: any;
}

export function PatientDisplaySection({
  isLoading,
  error,
  filteredPatients,
  activeFilter,
  loggedInDoctor,
  handlePrescriptionGenerated,
  PastHistoryDialog,
  PrescriptionForm,
}: PatientDisplaySectionProps) {
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    hasNextPage,
    hasPreviousPage,
    resetPagination,
  } = usePagination({
    data: filteredPatients,
    itemsPerPage: 9,
  });

  // Reset pagination whenever data changes
  useEffect(() => {
    resetPagination();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPatients]);

  if (isLoading || error || filteredPatients.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedData.map((patient) => (
          <Card
            key={patient._id}
            className="bg-white/70 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-3xl"
          >
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-orange-800 text-center">
                {patient.firstName} {patient.lastName}
              </CardTitle>
              <div className="text-center space-y-2">
                <div className="text-sm font-bold bg-gradient-to-r from-orange-400 to-red-600 text-white px-3 py-1 rounded-full inline-block">
                  ID: {patient.idno}
                </div>
                <div className="flex justify-center space-x-4 text-sm text-orange-600">
                  <span>
                    <strong>Age:</strong> {patient.age}
                  </span>
                  <span>
                    <strong>Gender:</strong> {patient.gender}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Buttons */}
              <div className="space-y-3">
                <PastHistoryDialog patient={patient} />
                {activeFilter === "recent" ? (
                  <PrescriptionForm
                    patient={patient}
                    doctorName={loggedInDoctor || ""}
                    onPrescriptionGenerated={handlePrescriptionGenerated}
                  />
                ) : (
                  <div className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-center">
                    Prescription Completed
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <PatientPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />

      {/* Pagination Info */}
      <div className="text-center text-sm text-gray-600 mt-4">
        Showing {(currentPage - 1) * 9 + 1}–{Math.min(currentPage * 9, filteredPatients.length)} of {filteredPatients.length} patients
        {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
      </div>
    </div>
  );
}
