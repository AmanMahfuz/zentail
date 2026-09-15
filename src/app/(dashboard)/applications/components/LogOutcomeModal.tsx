"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, CheckSquare, Target } from "lucide-react";
import { updateApplicationStatus } from "@/lib/actions/applications";

export function LogOutcomeModal({ applicationId, currentStatus, onStatusChange }: { applicationId: string, currentStatus: string, onStatusChange?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus || "applied");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateApplicationStatus(applicationId, status as any);
    if (onStatusChange) onStatusChange();
    setIsOpen(false);
    setIsSubmitting(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        variant="outline" 
        className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
      >
        <Target className="w-4 h-4 mr-2" />
        Log Outcome
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Log Application Outcome</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>What happened after you applied?</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved">No Response Yet (Saved)</SelectItem>
                    <SelectItem value="applied">Applied (Waiting)</SelectItem>
                    <SelectItem value="assessment">Received Assessment</SelectItem>
                    <SelectItem value="interview">Invited to Interview</SelectItem>
                    <SelectItem value="offer">Received Offer!</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  Zentail Engine uses this data to learn which resume variations get the most interviews and improve your future applications.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSubmitting ? "Logging..." : "Save Outcome"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
