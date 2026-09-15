export interface NextAction {
  action: string;
  urgency: "high" | "medium" | "low" | "none";
  link: string | null;
}

export function getNextAction(application: any, daysSinceApplied: number, daysToInterview: number | null): NextAction {
  // Mock data calculations since we don't have all data in memory easily
  // In a real scenario, this relies on full joins (interviews, resume match score)

  const hasInterview = application.status === "interview";
  const interviewPrepped = false; // Mock for now
  const resumeMatch = 75; // Mock for now

  if (hasInterview && daysToInterview !== null && daysToInterview <= 3) {
    return { action: "Practice interview", urgency: "high", link: `/interviews/${application.id}` };
  }
  if (hasInterview && !interviewPrepped) {
    return { action: "Complete interview prep", urgency: "medium", link: `/interviews/${application.id}` };
  }
  if (application.status === 'applied' && daysSinceApplied >= 7) {
    return { action: "Send follow-up email", urgency: "high", link: `/applications/${application.id}/followup` };
  }
  if (application.status === 'saved' && resumeMatch < 80) {
    return { action: "Improve resume match", urgency: "medium", link: `/applications/${application.id}/requirement-map` };
  }
  if (application.status === 'applied' && daysSinceApplied > 14 && !application.outcome_status) {
    return { action: "Record outcome (heard back?)", urgency: "low", link: `/applications/${application.id}/outcome` };
  }
  if (application.status === 'rejected' && !application.feedback) {
    return { action: "Record rejection feedback", urgency: "high", link: `/applications/${application.id}/outcome` };
  }
  if (application.status === 'rejected' || application.status === 'offer') {
    return { action: "View Outcome", urgency: "none", link: null };
  }

  return { action: "Wait for response", urgency: "none", link: null };
}
