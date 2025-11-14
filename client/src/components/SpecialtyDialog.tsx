
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Download } from "lucide-react";

interface SpecialtyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  specialties: string[];
  selectedSpecialties: string[];
  onSpecialtiesChange: (specialties: string[]) => void;
  onGenerate: () => void;
}

export default function SpecialtyDialog({
  isOpen,
  onClose,
  specialties,
  selectedSpecialties,
  onSpecialtiesChange,
  onGenerate,
}: SpecialtyDialogProps) {
  const handleSpecialtyToggle = (specialtyName: string) => {
    if (selectedSpecialties.includes(specialtyName)) {
      onSpecialtiesChange(selectedSpecialties.filter(s => s !== specialtyName));
    } else {
      onSpecialtiesChange([...selectedSpecialties, specialtyName]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSpecialties.length === specialties.length) {
      onSpecialtiesChange([]);
    } else {
      onSpecialtiesChange([...specialties]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-orange-200 max-h-[80vh]">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-orange-800">
            Select Medical Specialties
          </DialogTitle>
          <p className="text-sm text-orange-600 mt-2">
            Choose one or more specialties to generate the disease master report
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-orange-700">
                Selected: {selectedSpecialties.length}
              </span>
              {selectedSpecialties.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSpecialtiesChange([])}
                  className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  Clear All
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {selectedSpecialties.length === specialties.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {selectedSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-orange-50 rounded-lg border border-orange-200">
              {selectedSpecialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-64 w-full border border-orange-200 rounded-lg p-4">
            <div className="space-y-3">
              {specialties.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-3">
                  <Checkbox
                    id={specialty}
                    checked={selectedSpecialties.includes(specialty)}
                    onCheckedChange={() => handleSpecialtyToggle(specialty)}
                    className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <label
                    htmlFor={specialty}
                    className="text-sm text-gray-700 cursor-pointer flex-1 font-medium"
                  >
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onGenerate}
            disabled={selectedSpecialties.length === 0}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Report ({selectedSpecialties.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
