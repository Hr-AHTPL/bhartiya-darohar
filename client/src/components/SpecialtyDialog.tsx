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
      <DialogContent className="sm:max-w-2xl bg-white border-orange-200 h-[90vh] flex flex-col p-0">
        {/* Header - Fixed height */}
        <DialogHeader className="text-center pb-3 pt-6 px-6 flex-shrink-0">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-2">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-orange-800">
            Select Medical Specialties
          </DialogTitle>
          <p className="text-sm text-orange-600 mt-1">
            Choose one or more specialties to generate the disease master report
          </p>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden px-6">
          <div className="h-full flex flex-col gap-3">
            {/* Selection controls - Fixed */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-orange-700">
                  Selected: {selectedSpecialties.length}
                </span>
                {selectedSpecialties.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSpecialtiesChange([])}
                    className="text-xs h-7 border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                {selectedSpecialties.length === specialties.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Selected badges - Fixed max height with scroll */}
            {selectedSpecialties.length > 0 && (
              <div className="flex-shrink-0">
                <ScrollArea className="h-20 w-full">
                  <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex flex-wrap gap-1">
                      {selectedSpecialties.map((specialty) => (
                        <Badge 
                          key={specialty} 
                          variant="secondary" 
                          className="bg-orange-100 text-orange-700 text-xs whitespace-nowrap"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Specialty list - Scrollable */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full border border-orange-200 rounded-lg">
                <div className="p-4">
                  {specialties.map((specialty) => (
                    <div 
                      key={specialty} 
                      className="flex items-center space-x-3 py-2 hover:bg-orange-50 rounded px-2 -mx-2"
                    >
                      <Checkbox
                        id={specialty}
                        checked={selectedSpecialties.includes(specialty)}
                        onCheckedChange={() => handleSpecialtyToggle(specialty)}
                        className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 flex-shrink-0"
                      />
                      <label
                        htmlFor={specialty}
                        className="text-sm text-gray-700 cursor-pointer flex-1 font-medium select-none"
                      >
                        {specialty}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer buttons - Fixed */}
        <div className="flex gap-3 p-6 flex-shrink-0 border-t border-orange-100 bg-white">
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
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Report ({selectedSpecialties.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}