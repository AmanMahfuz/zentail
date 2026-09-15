"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationOutcome } from "@/lib/actions/applications";

export function RecordOutcomeModal({ app, isOpen, onOpenChange }: { app: any, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState("rejected");
  const [stage, setStage] = useState("resume_screen");
  const [feedback, setFeedback] = useState("");

  if (!app) return null;

  const handleSave = async () => {
    setLoading(true);
    await updateApplicationOutcome(app.id, {
      outcome_status: outcome,
      stage_reached: stage,
      feedback: feedback
    });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Outcome: {app.job?.company}</DialogTitle>
          <DialogDescription>
            What was the final result of this application? This helps us find patterns in what works.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Result</label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v || '')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Got interview</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="offer">Got offer</SelectItem>
                <SelectItem value="ghosted">Ghosted (No response)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">What stage did you reach?</label>
            <Select value={stage} onValueChange={(v) => setStage(v || '')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never_heard_back">Never heard back</SelectItem>
                <SelectItem value="resume_screen">Resume screened out</SelectItem>
                <SelectItem value="phone_screen">Phone screen</SelectItem>
                <SelectItem value="technical_round">Technical round</SelectItem>
                <SelectItem value="final_round">Final round</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Feedback received (optional)</label>
            <Textarea 
              placeholder="e.g. Skills match was good but no Docker experience"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>Save Outcome</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
