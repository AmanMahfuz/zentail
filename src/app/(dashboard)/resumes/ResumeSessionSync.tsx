"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function ResumeSessionSync({ resumesCount }: { resumesCount: number }) {
  const router = useRouter();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (resumesCount > 0 || syncingRef.current) return;

    try {
      const stored = sessionStorage.getItem("parsed_resume");
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (!parsed || (!parsed.personal?.fullName && !parsed.name && !parsed.skills?.length)) {
        return;
      }

      syncingRef.current = true;

      // Automatically sync the cached uploaded resume to database
      fetch("/api/resumes/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.personal?.fullName ? `${parsed.personal.fullName}'s Master Resume` : "Uploaded Master Resume",
          markdown: `# ${parsed.personal?.fullName || parsed.name || "Candidate"}\n\n${parsed.summary || ""}`,
          data: {
            contact: {
              name: parsed.personal?.fullName || parsed.name || "",
              title: parsed.personal?.jobTitle || parsed.currentRole || "",
              email: parsed.personal?.email || "",
              phone: parsed.personal?.phone || "",
              location: parsed.personal?.location || "",
              linkedin: parsed.personal?.linkedinUrl || "",
              github: parsed.personal?.githubUrl || "",
              website: parsed.personal?.portfolioUrl || "",
            },
            summary: parsed.summary || "",
            skills: Array.isArray(parsed.skills)
              ? [{ category: "Core Technologies", items: parsed.skills.map((s: any) => typeof s === "string" ? s : s.name).join(", ") }]
              : [],
            experience: Array.isArray(parsed.experience)
              ? parsed.experience.map((e: any) => ({
                  company: e.company || "",
                  title: e.jobTitle || e.title || "",
                  location: e.location || "",
                  date: `${e.startDate || ""} - ${e.isCurrent ? "Present" : e.endDate || ""}`.trim(),
                  bullets: Array.isArray(e.bullets) ? e.bullets : (e.description ? [e.description] : []),
                }))
              : [],
            education: Array.isArray(parsed.education)
              ? parsed.education.map((ed: any) => ({
                  school: ed.institution || ed.school || "",
                  degree: ed.degree || "",
                  location: "",
                  date: `${ed.startYear || ""} - ${ed.endYear || ""}`.trim(),
                  gpa: ed.grade || "",
                }))
              : [],
            projects: Array.isArray(parsed.projects)
              ? parsed.projects.map((p: any) => ({
                  name: p.title || p.name || "",
                  description: p.description || "",
                  tech: Array.isArray(p.techStack) ? p.techStack.join(", ") : "",
                  link: p.url || p.githubUrl || "",
                }))
              : [],
            theme: {
              template: "basic",
              primaryColor: "#0f172a",
              fontFamily: "Inter",
              fontSize: "normal",
              layoutDensity: "normal",
              atsModeActive: false,
            },
          },
        }),
      })
        .then((res) => {
          if (res.ok) {
            router.refresh();
          }
        })
        .catch((err) => {
          console.warn("Session resume sync error:", err);
        });
    } catch (e) {
      console.warn("Failed to check session resume:", e);
    }
  }, [resumesCount, router]);

  return null;
}
