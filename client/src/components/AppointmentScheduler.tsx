import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppointmentSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentScheduler = ({ isOpen, onClose }: AppointmentSchedulerProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    patientName: "",
    date: "",
    time: "",
    reason: "",
    type: "consultation"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Scheduling appointment:", formData);
    toast({
      title: "Appointment Scheduled!",
      description: `Appointment for ${formData.patientName} on ${formData.date} at ${formData.time}`,
    });
    setFormData({ patientName: "", date: "", time: "", reason: "", type: "consultation" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border-2 border-orange-200 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-black flex items-center space-x-3 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
              <Calendar className="h-6 w-6 text-orange-600" />
              <span>Schedule Appointment</span>
            </CardTitle>
            <Button variant="outline" size="icon" onClick={onClose} className="rounded-full border-orange-300 text-orange-600 hover:bg-orange-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName" className="text-orange-700 font-semibold">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  placeholder="Enter patient name"
                  required
                  className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-orange-700 font-semibold">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-orange-700 font-semibold">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  required
                  className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-orange-700 font-semibold">Appointment Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full h-10 px-3 py-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="checkup">Therapy</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-orange-700 font-semibold">Reason for Visit</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Describe the reason for this appointment"
                rows={3}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Schedule Appointment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentScheduler;