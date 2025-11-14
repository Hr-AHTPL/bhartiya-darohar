/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import AutoSuggestInput from '@/components/AutoSuggestInput';
import TimingSelector from '@/components/TimingSelector';

export interface SubMedicine {
  name: string;
  quantity: string;
}

export interface Medicine {
  subMedicines: SubMedicine[];
  dose: string;
  intake: string;
  timings: string[];
  otherTiming: string;
  duration: string;
}

interface MedicineFormProps {
  medicine: Medicine;
  index: number;
  medicineNames: string[];
  activeInputId: string | null;
  setActiveInputId: (id: string | null) => void;
  onUpdate: (index: number, medicine: Medicine) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const MedicineForm: React.FC<MedicineFormProps> = ({
  medicine,
  index,
  medicineNames,
  activeInputId,
  setActiveInputId,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  const addSubMedicine = () => {
    const updatedMedicine = {
      ...medicine,
      subMedicines: [...medicine.subMedicines, { name: '', quantity: '' }],
    };
    onUpdate(index, updatedMedicine);
  };

  const removeSubMedicine = (subIndex: number) => {
    if (medicine.subMedicines.length > 1) {
      const updatedMedicine = {
        ...medicine,
        subMedicines: medicine.subMedicines.filter((_, i) => i !== subIndex),
      };
      onUpdate(index, updatedMedicine);
    }
  };

  const updateSubMedicine = (subIndex: number, field: keyof SubMedicine, value: string) => {
    const updatedSubMedicines = medicine.subMedicines.map((sub, i) =>
      i === subIndex ? { ...sub, [field]: value } : sub
    );
    const updatedMedicine = {
      ...medicine,
      subMedicines: updatedSubMedicines,
    };
    onUpdate(index, updatedMedicine);
  };

  const updateMedicineField = (field: keyof Medicine, value: any) => {
    const updatedMedicine = {
      ...medicine,
      [field]: value,
    };
    onUpdate(index, updatedMedicine);
  };

  return (
    <div className="p-6 border-2 border-orange-200 rounded-lg space-y-4 bg-orange-50/30">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-orange-700">Medicine {index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sub-medicines */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold text-orange-600">Medicine Components</Label>
          <Button
            type="button"
            onClick={addSubMedicine}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Component
          </Button>
        </div>

        {medicine.subMedicines.map((subMed, subIndex) => (
          <div key={subIndex} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-orange-100">
            <div className="md:col-span-2">
              <AutoSuggestInput
                id={`submedicine-${index}-${subIndex}`}
                label={`Component ${subIndex + 1}`}
                placeholder="Type medicine name..."
                value={subMed.name}
                onChange={(value) => updateSubMedicine(subIndex, 'name', value)}
                suggestions={medicineNames}
                activeInputId={activeInputId}
                setActiveInputId={setActiveInputId}
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-sm text-orange-600">Quantity</Label>
                <Input
                  placeholder="e.g., 10gm, 5ml"
                  value={subMed.quantity}
                  onChange={(e) => updateSubMedicine(subIndex, 'quantity', e.target.value)}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              
              {medicine.subMedicines.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeSubMedicine(subIndex)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Universal fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-orange-200">
        <div>
          <Label className="text-sm text-orange-600">Dose</Label>
          <Input
            placeholder="e.g., 1 teaspoon"
            value={medicine.dose}
            onChange={(e) => updateMedicineField('dose', e.target.value)}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
        <div>
          <Label className="text-sm text-orange-600">Intake</Label>
          <Input
            placeholder="e.g., with water, with milk"
            value={medicine.intake}
            onChange={(e) => updateMedicineField('intake', e.target.value)}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
        <div>
          <Label className="text-sm text-orange-600">Duration</Label>
          <Input
            placeholder="e.g., 7 days, 2 weeks"
            value={medicine.duration}
            onChange={(e) => updateMedicineField('duration', e.target.value)}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
        <div>
          <TimingSelector
            selectedTimings={medicine.timings}
            otherTiming={medicine.otherTiming}
            onTimingChange={(timings) => updateMedicineField('timings', timings)}
            onOtherTimingChange={(value) => updateMedicineField('otherTiming', value)}
          />
        </div>
      </div>
    </div>
  );
};

export default MedicineForm;