import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver"; 
interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportGenerator = ({ isOpen, onClose }: ReportGeneratorProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    reportType: "revenue",
    dateFrom: "",
    dateTo: "",
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates
    if (formData.reportType !== "medicine-stock") {
      if (!formData.dateFrom || !formData.dateTo) {
        toast({
          title: "Validation Error",
          description: "Please select both from and to dates.",
          variant: "destructive",
        });
        return;
      }
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      dateFrom: formData.dateFrom,
      dateTo: formData.dateTo,
    });
    if (formData.reportType === "medicine-stock") {
  try {
    const response = await fetch("https://bhartiyadharohar.in/medicine/view");
    const data = await response.json();

    if (data && Array.isArray(data.medicineList)) {
      // Step 1: Prepare and sort data
      const medicines = data.medicineList
        .map((item) => ({
          Code: item.Code,
          "Product Name": item["Product Name"],
          Unit: item.Unit,
          Company: item.Company,
          Quantity: item.Quantity,
        }))
        .sort((a, b) => a.Code - b.Code);

      // Step 2: Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(medicines);

      // Step 3: Apply styles
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Define column widths
      worksheet['!cols'] = [
        { wch: 10 },  // Code
        { wch: 20 },  // Product Name
        { wch: 10 },  // Unit
        { wch: 15 },  // Company
        { wch: 10 },  // Quantity
      ];

      // Center align and bold headers with yellow background
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        const cell = worksheet[cellAddress];
        if (cell) {
          cell.s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFFF00" } }, // yellow
            alignment: { horizontal: "center", vertical: "center" },
          };
        }
      }

      // Center-align all data rows
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cellAddress];
          if (cell) {
            cell.s = {
              alignment: { horizontal: "center", vertical: "center" },
            };
          }
        }
      }

      // Step 4: Build and export workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Medicine Stock");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true, // <-- important for styling
      });

      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, "Medicine_Stock_Report.xlsx");
    } else {
      alert("No data found.");
    }
  } catch (error) {
    console.error("Error generating report:", error);
    alert("Failed to fetch medicine data.");
  }

  return;
}
 else if (formData.reportType === "patient-master") {
      try {
        const response = await fetch(
          `https://bhartiyadharohar.in/api/website/enquiry/patient-master?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PatientMaster.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Report Downloaded!",
          description: "Patient Master report has been downloaded.",
        });

        onClose();
      } catch (error) {
        console.error("Error downloading report:", error);
        toast({
          title: "Error",
          description: "Failed to generate report.",
          variant: "destructive",
        });
      }
    } else if (formData.reportType === "patient-summary") {
      try {
        const response = await fetch(
          `https://bhartiyadharohar.in/api/website/enquiry/patient-billing-master?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PatientSummary.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Report Downloaded!",
          description: "Patient Summary report has been downloaded.",
        });

        onClose();
      } catch (error) {
        console.error("Error downloading report:", error);
        toast({
          title: "Error",
          description: "Failed to generate report.",
          variant: "destructive",
        });
      }
    } else if (formData.reportType === "revenue") {
      try {
        const response = await fetch(
          `https://bhartiyadharohar.in/api/website/enquiry/revenue-report?${queryParams}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch revenue report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "RevenueReport.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Report Downloaded!",
          description: "Revenue report has been downloaded.",
        });

        onClose();
      } catch (error) {
        console.error("Error downloading revenue report:", error);
        toast({
          title: "Error",
          description: "Failed to download revenue report.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Feature Not Implemented",
        description: `Report type "${formData.reportType}" is not available yet.`,
        variant: "default",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-black flex items-center space-x-3">
              <FileText className="h-6 w-6 text-orange-600" />
              <span>Generate Report</span>
            </CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:border-orange-500"
            >
              <X className="h-4 w-4 text-orange-600" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="reportType" className="text-orange-700">
                  Report Type
                </Label>
                <select
                  id="reportType"
                  value={formData.reportType}
                  onChange={(e) =>
                    setFormData({ ...formData, reportType: e.target.value })
                  }
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="revenue">Revenue Report</option>
                  <option value="patient-master">Patient Master</option>
                  <option value="patient-summary">Patient Summary</option>
                  <option value="medicine-stock">
                    Medicine Dispensing/Stock Report
                  </option>
                </select>
              </div>

              {/* Show dates conditionally */}
              {formData.reportType !== "medicine-stock" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom" className="text-orange-700">
                      From Date
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={formData.dateFrom}
                      onChange={(e) =>
                        setFormData({ ...formData, dateFrom: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateTo" className="text-orange-700">
                      To Date
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={formData.dateTo}
                      onChange={(e) =>
                        setFormData({ ...formData, dateTo: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="hover:border-orange-500 text-orange-600"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportGenerator;
