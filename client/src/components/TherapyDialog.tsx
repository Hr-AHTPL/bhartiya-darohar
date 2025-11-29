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
import { Flower2, Download } from "lucide-react";

interface TherapyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  therapiesData: Array<{ name: string }>;
  selectedTherapies: string[];
  onTherapiesChange: (therapies: string[]) => void;
  onGenerate: () => void;
}

export default function TherapyDialog({
  isOpen,
  onClose,
  therapiesData,
  selectedTherapies,
  onTherapiesChange,
  onGenerate,
}: TherapyDialogProps) {
  const handleTherapyToggle = (therapyName: string) => {
    if (selectedTherapies.includes(therapyName)) {
      onTherapiesChange(selectedTherapies.filter(t => t !== therapyName));
    } else {
      onTherapiesChange([...selectedTherapies, therapyName]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTherapies.length === therapiesData.length) {
      onTherapiesChange([]);
    } else {
      onTherapiesChange(therapiesData.map(t => t.name));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-orange-200 h-[90vh] flex flex-col p-0">
        {/* Header - Fixed height */}
        <DialogHeader className="text-center pb-3 pt-6 px-6 flex-shrink-0">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-2">
            <Flower2 className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-orange-800">
            Select Therapies
          </DialogTitle>
          <p className="text-sm text-orange-600 mt-1">
            Choose one or more therapies to generate the report
          </p>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden px-6">
          <div className="h-full flex flex-col gap-3">
            {/* Selection controls - Fixed */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-orange-700">
                  Selected: {selectedTherapies.length}
                </span>
                {selectedTherapies.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTherapiesChange([])}
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
                {selectedTherapies.length === therapiesData.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Selected badges - Fixed max height with scroll */}
            {selectedTherapies.length > 0 && (
              <div className="flex-shrink-0">
                <ScrollArea className="h-20 w-full">
                  <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex flex-wrap gap-1">
                      {selectedTherapies.map((therapy) => (
                        <Badge 
                          key={therapy} 
                          variant="secondary" 
                          className="bg-orange-100 text-orange-700 text-xs whitespace-nowrap"
                        >
                          {therapy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Therapy list - Scrollable */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full border border-orange-200 rounded-lg">
                <div className="p-4">
                  {therapiesData.map((therapy) => (
                    <div 
                      key={therapy.name} 
                      className="flex items-center space-x-3 py-2 hover:bg-orange-50 rounded px-2 -mx-2"
                    >
                      <Checkbox
                        id={therapy.name}
                        checked={selectedTherapies.includes(therapy.name)}
                        onCheckedChange={() => handleTherapyToggle(therapy.name)}
                        className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 flex-shrink-0"
                      />
                      <label
                        htmlFor={therapy.name}
                        className="text-sm text-gray-700 cursor-pointer flex-1 leading-tight select-none"
                      >
                        {therapy.name}
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
            disabled={selectedTherapies.length === 0}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate ({selectedTherapies.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}