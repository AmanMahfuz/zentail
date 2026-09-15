"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus } from "lucide-react";
import { createInterview, InterviewType } from "@/lib/actions/interviews";

export function AddInterviewModal({ 
  applicationId, 
  controlledOpen, 
  setControlledOpen 
}: { 
  applicationId: string;
  controlledOpen?: boolean;
  setControlledOpen?: (val: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [round, setRound] = useState("1");
  const [type, setType] = useState<InterviewType>("technical");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError("Please select a date and time.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let scheduledAt = "";
    try {
      // Create a valid ISO string. Safari requires seconds for standard parsing.
      const timeWithSeconds = time.includes(":") && time.length === 5 ? `${time}:00` : time;
      scheduledAt = new Date(`${date}T${timeWithSeconds}`).toISOString();
    } catch (err) {
      setError("Invalid date or time format.");
      setIsSubmitting(false);
      return;
    }

    const res = await createInterview(applicationId, {
      round: parseInt(round, 10),
      interview_type: type,
      scheduled_at: scheduledAt,
      notes,
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsOpen(false);
      // Reset form
      setRound("1");
      setType("technical");
      setDate("");
      setTime("");
      setNotes("");
    } else {
      setError(res.message || "Failed to schedule interview.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger>
          <div className="inline-flex h-9 w-full items-center justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 shadow-sm cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> Schedule Interview Round
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Round Number</Label>
              <Input type="number" min="1" max="10" value={round} onChange={e => setRound(e.target.value)} required className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Interview Type</Label>
              <Select value={type} onValueChange={(val: any) => val && setType(val)}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-blue-500/20 transition-all bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="hr">HR / Behavioral</SelectItem>
                  <SelectItem value="case">Case Study</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} required className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Notes / Details (Optional)</Label>
            <Textarea 
              placeholder="Meeting link, interviewer names, etc..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              className="resize-none min-h-[100px] rounded-xl border-slate-200 focus-visible:ring-blue-500/20 transition-all p-3 text-sm"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="h-11 px-6 rounded-xl shadow-sm text-white transition-all hover:-translate-y-0.5" style={{ backgroundColor: "var(--color-sunset-orange)" }}>
              {isSubmitting ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
