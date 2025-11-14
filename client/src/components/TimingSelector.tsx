
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimingSelectorProps {
  selectedTimings: string[];
  otherTiming: string;
  onTimingChange: (timings: string[]) => void;
  onOtherTimingChange: (value: string) => void;
}

const TimingSelector: React.FC<TimingSelectorProps> = ({
  selectedTimings,
  otherTiming,
  onTimingChange,
  onOtherTimingChange,
}) => {
  const timingOptions = [
    'Before Breakfast',
    'After Breakfast',
    'Before Lunch',
    'After Lunch',
    'Before Dinner',
    'After Dinner',
  ];

  const toggleTiming = (timing: string) => {
    if (selectedTimings.includes(timing)) {
      onTimingChange(selectedTimings.filter(t => t !== timing));
    } else {
      onTimingChange([...selectedTimings, timing]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm text-orange-600">Timing</Label>
      <div className="grid grid-cols-2 gap-2">
        {timingOptions.map((timing) => (
          <Button
            key={timing}
            type="button"
            variant={selectedTimings.includes(timing) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleTiming(timing)}
            className={`text-xs ${
              selectedTimings.includes(timing)
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "border-orange-200 text-orange-600 hover:bg-orange-50"
            }`}
          >
            {timing}
          </Button>
        ))}
      </div>
      <div>
        <Label className="text-xs text-orange-500">Other</Label>
        <Input
          placeholder="Enter custom timing..."
          value={otherTiming}
          onChange={(e) => onOtherTimingChange(e.target.value)}
          className="border-orange-200 focus:border-orange-400"
        />
      </div>
    </div>
  );
};

export default TimingSelector;