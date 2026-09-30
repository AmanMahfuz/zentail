import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI, Type } from "@google/genai";
import { generateContentWithRetry } from "@/lib/gemini";
import { categorizeSkills, classifySkillName } from "@/lib/resume/skills-categorizer";
import { generateInterviewPrep } from "@/lib/actions/phase3";
import { getCachedAIResult, setCachedAIResult, CACHE_TTL_DAYS } from "@/lib/cache";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in or sign up." }, { status: 401 });
    }

    const body = await request.json();
    let { profile, jobDescription, analysis } = body;

    if (!jobDescription || !profile) {
      return NextResponse.json({ error: "Profile and Job Description are required." }, { status: 400 });
    }

    const jobTitle = analysis?.jobTitle || "Software Engineer";
    const companyName = analysis?.company || "Target Company";
    const fitScore = typeof analysis?.fitScore === "number" ? analysis.fitScore : 70;

    // 1. Upsert User Profile & Mark Onboarding Completed
    await (supabase as any).from("profiles").upsert({
      id: user.id,
      email: user.email || profile.personal?.email,
      full_name: profile.personal?.fullName || user.user_metadata?.full_name || "Candidate",
      target_role: jobTitle || profile.personal?.jobTitle || null,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

    // 2. Upsert User Evidence
    await (supabase as any).from("user_evidence").upsert({
      user_id: user.id,
      full_name: profile.personal?.fullName || user.user_metadata?.full_name || "Candidate",
      email: profile.personal?.email || user.email,
      phone: profile.personal?.phone || null,
      location: (profile.personal?.location && !profile.personal.location.toLowerCase().includes("remote")) ? profile.personal.location : null,
      linkedin_url: profile.personal?.linkedinUrl || null,
      github_url: profile.personal?.githubUrl || null,
      portfolio_url: profile.personal?.portfolioUrl || null,
      summary: profile.summary || null,
      last_synced_at: new Date().toISOString()
    }, { onConflict: "user_id" });

    // 2. Upsert Skills
    if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
      await (supabase as any).from("evidence_skills").upsert(
        profile.skills.map((s: any) => {
          const sName = typeof s === "string" ? s : s.name;
          const userCat = typeof s === "object" ? s.category : "";
          const finalCat = (userCat && userCat.toLowerCase() !== "core") ? userCat : classifySkillName(sName);
          return {
            user_id: user.id,
            skill_name: sName,
            category: finalCat,
            proficiency: typeof s === "object" ? s.proficiency || "intermediate" : "intermediate",
            proof_status: "self_reported"
          };
        }),
        { onConflict: "user_id,skill_name" }
      );
    }

    // 3. Upsert Experience / Projects / Education if present
    if (profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0) {
      await (supabase as any).from("evidence_experience").insert(
        profile.experience.map((e: any, i: number) => ({
          user_id: user.id,
          job_title: e.jobTitle || e.title || "Role",
          company: e.company || "Company",
          start_date: e.startDate || null,
          end_date: e.endDate || null,
          is_current: !!e.isCurrent,
          description: e.description || "",
          bullets: e.bullets || [],
          skills_used: e.skillsUsed || [],
          sort_order: i
        }))
      );
    }

    if (profile.projects && Array.isArray(profile.projects) && profile.projects.length > 0) {
      await (supabase as any).from("evidence_projects").insert(
        profile.projects.map((p: any, i: number) => ({
          user_id: user.id,
          title: p.title || "Project",
          description: p.description || "",
          bullets: p.bullets || [],
          url: p.url || null,
          github_url: p.githubUrl || null,
          tech_stack: p.techStack || [],
          sort_order: i
        }))
      );
    }

    if (profile.education && Array.isArray(profile.education) && profile.education.length > 0) {
      await (supabase as any).from("evidence_education").insert(
        profile.education.map((ed: any, i: number) => ({
          user_id: user.id,
          degree: ed.degree || "Degree",
          institution: ed.institution || "Institution",
          field_of_study: ed.fieldOfStudy || "",
          start_year: ed.startYear || null,
          end_year: ed.endYear || null,
          grade: ed.grade || null,
          sort_order: i
        }))
      );
    }

    // 4. Check existing resume versions
    const { data: existingVersions } = await (supabase as any)
      .from("resume_versions")
      .select("id, version_number, origin_type, content")
      .eq("user_id", user.id)
      .order("version_number", { ascending: false });

    let currentVersionNum = (existingVersions?.[0]?.version_number || 0);

    // Save baseline master or upload version if not already present
    const requestedOrigin = body.originType || profile.origin_type || (body.isBuilt ? "built" : "upload");
    let baseVersion = existingVersions?.find((v: any) => v.origin_type === "upload" || v.origin_type === "master" || v.origin_type === "built");
    if (!baseVersion) {
      currentVersionNum += 1;
      const versionLabel = requestedOrigin === "built" ? "V1 Master Resume (Built)" : "V1 Original Upload";
      const { data: newBase, error: baseErr } = await (supabase as any)
        .from("resume_versions")
        .insert({
          user_id: user.id,
          version_number: currentVersionNum,
          version_label: versionLabel,
          is_latest: false,
          origin_type: requestedOrigin,
          content: profile,
          template_id: "clean"
        })
        .select()
        .single();

      if (!baseErr && newBase) {
        baseVersion = newBase;
      }
    }

    // If the candidate already has existing resumes in their collection, scan them to find the closest match
    let scanStrategy = "standard_tailoring";
    let scanMatchPct = 70;
    if (existingVersions && existingVersions.length > 1 && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const previews = existingVersions.slice(0, 5).map((v: any) => ({
          id: v.id,
          label: v.version_label,
          skills: (v.content?.skills || []).slice(0, 8),
          summary: v.content?.summary || JSON.stringify(v.content || "").slice(0, 250),
        }));

        const scanPrompt = `
          Compare these candidate resumes against this target job:
          Job: ${jobTitle} at ${companyName}
          JD: ${jobDescription.slice(0, 2000)}

          Resumes in collection:
          ${JSON.stringify(previews, null, 2)}

          Select the single best matching resume ID from the candidates to use as base, or return "current" to use the newly provided profile.
          Estimate the match percentage (0-100).
        `;

        const scanRes = await generateContentWithRetry({
          ai,
          contents: scanPrompt,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                selected_id: { type: Type.STRING },
                match_percentage: { type: Type.INTEGER },
                alteration_strategy: { type: Type.STRING },
              },
              required: ["selected_id", "match_percentage"],
            },
          },
        });

        const scanParsed = JSON.parse((scanRes as any).text || "{}");
        if (scanParsed.selected_id && scanParsed.selected_id !== "current") {
          const found = existingVersions.find((v: any) => v.id === scanParsed.selected_id);
          if (found && found.content) {
            baseVersion = found;
            profile = found.content;
            scanStrategy = scanParsed.alteration_strategy || (scanParsed.match_percentage >= 80 ? "minor_alterations" : "standard_tailoring");
            scanMatchPct = scanParsed.match_percentage;
            console.log(`[create-from-landing] Selected base from collection: "${found.version_label}" (${scanMatchPct}%)`);
          }
        }
      } catch (scanErr) {
        console.warn("Scan existing versions warning:", scanErr);
      }
    }

    // Check if the candidate's existing resume already qualifies for the interview
    const INTERVIEW_QUALIFIED_THRESHOLD = 80;
    const effectiveMatchScore = Math.max(fitScore, scanMatchPct);
    const isInterviewQualified = effectiveMatchScore >= INTERVIEW_QUALIFIED_THRESHOLD;

    let targetResumeVersionId = baseVersion?.id || null;
    let tailoredVersion: any = null;

    // Determine if candidate is fresher/student
    const hasMeaningfulExperience = Array.isArray(profile.experience) && profile.experience.some((e: any) => (e.title || e.jobTitle) && (e.company || e.description));
    const isFresher = !hasMeaningfulExperience || profile.candidateType === "fresher" || (profile.currentRole && /student|fresher|aspiring/i.test(profile.currentRole));

    // Clean location from placeholder "Remote"
    const cleanedPersonal = { ...(profile.personal || {}) };
    if (cleanedPersonal.location && /remote/i.test(cleanedPersonal.location)) {
      cleanedPersonal.location = "";
    }

    if (!isInterviewQualified) {
      // 5. Generate Tailored Resume grounded strictly in candidate evidence
      let tailoredContent = { ...profile, personal: cleanedPersonal };
      const tailorCacheInput = { profile, jobTitle, companyName, jobDescription, scanStrategy };
      const cachedTailor = await getCachedAIResult<any>("resume_tailor", tailorCacheInput, {
        tokensToAdd: 2000,
      });

      if (cachedTailor) {
        tailoredContent = cachedTailor.data;
      } else if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const tailorPrompt = `
            You are an expert executive resume writer and ATS strategist.
            Generate an evidence-grounded, professional resume tailored for the target role: "${jobTitle}" at "${companyName}".

            CRITICAL SYSTEM RULES:
            1. EVIDENCE GROUNDING: You can improve phrasing, technical clarity, and bullet structure, but you CANNOT manufacture companies, degrees, metrics, or technologies not present in the candidate's background.
            2. FRESHER VS EXPERIENCED ARCHITECTURE:
               Candidate is ${isFresher ? "a Fresher / Student" : "an Experienced Candidate"}.
               ${isFresher ? `
               - Prioritize KEY PROJECTS and EDUCATION.
               - If experience is empty or just trivial notes, omit or minimize experience and give deep, multi-bullet technical substance to the Projects (What was built, technical implementation/architecture, outcome/live status).
               - Do NOT output empty or duplicated experience sections.
               ` : `
               - Focus on WORK EXPERIENCE achievements with strong action verbs and outcomes.
               - Highlight key production projects and technical contributions.
               `}
            3. SKILLS CATEGORIZATION:
               Organize skills into clean industry categories (e.g. Languages, Frameworks & Libraries, Backend & APIs, Databases, Developer Tools & Cloud).
               NEVER use internal labels like "core" or "general".
            4. PROFESSIONAL SUMMARY:
               Craft a compelling 2–3 line summary that aligns the candidate's real verified skills with "${jobTitle}".
            5. LOCATION:
               If location is "Remote" or unspecified, leave location blank. Do not invent an address.

            Candidate Evidence:
            ${JSON.stringify({ ...profile, personal: cleanedPersonal }, null, 2)}

            Target Job Description:
            Title: ${jobTitle}
            Company: ${companyName}
            Description: ${jobDescription.slice(0, 4000)}

            Return JSON ONLY with this shape:
            {
              "personal": {
                "fullName": "${cleanedPersonal.fullName || 'Candidate'}",
                "jobTitle": "${jobTitle}",
                "email": "${cleanedPersonal.email || ''}",
                "phone": "${cleanedPersonal.phone || ''}",
                "location": "${cleanedPersonal.location || ''}",
                "linkedinUrl": "${cleanedPersonal.linkedinUrl || ''}",
                "githubUrl": "${cleanedPersonal.githubUrl || ''}",
                "portfolioUrl": "${cleanedPersonal.portfolioUrl || ''}"
              },
              "summary": "Compelling 2-3 sentence tailored summary...",
              "skills": [
                { "category": "Languages", "items": "JavaScript, TypeScript..." },
                { "category": "Frameworks & Libraries", "items": "React, Next.js..." },
                { "category": "Backend & APIs", "items": "Node.js, REST APIs..." },
                { "category": "Databases", "items": "PostgreSQL, Supabase..." },
                { "category": "Developer Tools & Cloud", "items": "Git, Docker..." }
              ],
              "projects": [
                {
                  "title": "Project Title",
                  "techStack": ["React", "TypeScript"],
                  "githubUrl": "url or null",
                  "liveUrl": "url or null",
                  "bullets": [
                    "Engineered...",
                    "Implemented...",
                    "Deployed..."
                  ]
                }
              ],
              "experience": ${isFresher ? "[]" : `[
                {
                  "jobTitle": "Role",
                  "company": "Company",
                  "startDate": "Date",
                  "endDate": "Date",
                  "bullets": ["Accomplished..."]
                }
              ]`},
              "education": ${JSON.stringify(profile.education || [])},
              "certifications": ${JSON.stringify(profile.certifications || [])}
            }
          `;

          const response = await generateContentWithRetry({
            ai,
            contents: tailorPrompt,
            config: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          });

          const rawText = (response as any).text || "";
          const jsonStart = rawText.indexOf("{");
          const jsonEnd = rawText.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
            tailoredContent = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
            // Cache result
            await setCachedAIResult("resume_tailor", tailorCacheInput, tailoredContent, {
              ttlDays: CACHE_TTL_DAYS.RESUME_TAILOR,
              tokens: 2000,
              model: "gemini-3.8-flash",
            });
          }
        } catch (tailorErr) {
          console.warn("AI tailoring fallback to original profile:", tailorErr);
        }
      }

      // 6. Save or Update Tailored Resume Version (prevent duplicate copies for the same job!)
      const tailoredLabel = `Tailored for ${companyName} (${jobTitle})`;
      const { data: existingTailored } = await (supabase as any)
        .from("resume_versions")
        .select("id, version_number")
        .eq("user_id", user.id)
        .eq("version_label", tailoredLabel)
        .maybeSingle();

      if (existingTailored) {
        const { data: updatedTailored } = await (supabase as any)
          .from("resume_versions")
          .update({
            content: tailoredContent,
            is_latest: true,
            parent_version_id: baseVersion?.id || null,
          })
          .eq("id", existingTailored.id)
          .select()
          .single();
        tailoredVersion = updatedTailored || existingTailored;
      } else {
        currentVersionNum += 1;
        await (supabase as any)
          .from("resume_versions")
          .update({ is_latest: false })
          .eq("user_id", user.id);

        const { data: newTailored, error: tailoredErr } = await (supabase as any)
          .from("resume_versions")
          .insert({
            user_id: user.id,
            version_number: currentVersionNum,
            version_label: tailoredLabel,
            is_latest: true,
            origin_type: "tailored",
            parent_version_id: baseVersion?.id || null,
            content: tailoredContent,
            template_id: isFresher ? "fresher" : "balanced"
          })
          .select()
          .single();

        if (tailoredErr) {
          console.error("Failed to insert tailored resume version:", tailoredErr);
        } else {
          tailoredVersion = newTailored;
        }
      }

      targetResumeVersionId = tailoredVersion?.id || baseVersion?.id || null;
    } else {
      console.log(`[create-from-landing] Candidate match score is ${effectiveMatchScore}% (>= ${INTERVIEW_QUALIFIED_THRESHOLD}%). Interview qualified — skipping tailoring!`);
      if (baseVersion?.id) {
        await (supabase as any)
          .from("resume_versions")
          .update({ is_latest: true })
          .eq("id", baseVersion.id);
      }
    }

    // 7. Ensure a record in `jobs` table
    let jobId = null;
    const { data: existingJob } = await (supabase as any)
      .from("jobs")
      .select("id")
      .eq("user_id", user.id)
      .eq("company", companyName)
      .eq("title", jobTitle)
      .maybeSingle();

    if (existingJob) {
      jobId = existingJob.id;
    } else {
      const { data: newJob } = await (supabase as any)
        .from("jobs")
        .insert({
          user_id: user.id,
          company: companyName,
          title: jobTitle,
          description: jobDescription,
          location: profile.personal?.location || null,
        })
        .select("id")
        .single();
      jobId = newJob?.id || null;
    }

    // 8. Create or Update Application
    const fitLevel = effectiveMatchScore >= 80 ? "strong" : effectiveMatchScore >= 60 ? "moderate" : "weak";
    const fitVerdict = isInterviewQualified
      ? (analysis?.verdict ? `${analysis.verdict} (Interview Ready — original resume used directly)` : `Interview Qualified (${effectiveMatchScore}% ATS Match). Your uploaded resume already exceeds the ${INTERVIEW_QUALIFIED_THRESHOLD}% threshold, so no tailoring was needed!`)
      : (analysis?.verdict || null);

    const { data: existingApp } = await (supabase as any)
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_name", companyName)
      .eq("job_title", jobTitle)
      .maybeSingle();

    let application: any = null;
    if (existingApp) {
      const { data: updatedApp, error: updateErr } = await (supabase as any)
        .from("applications")
        .update({
          job_id: jobId,
          resume_version_id: targetResumeVersionId,
          fit_score: effectiveMatchScore,
          fit_level: fitLevel,
          matched_skills: analysis?.matched || [],
          partial_skills: analysis?.partial || [],
          missing_skills: analysis?.missing || [],
          fit_summary: fitVerdict,
          improvements: analysis?.improvements || [],
          status: "saved",
        })
        .eq("id", existingApp.id)
        .select("id")
        .single();

      if (updateErr) {
        console.error("Application update error:", updateErr);
      }
      application = updatedApp || existingApp;
    } else {
      const { data: newApp, error: appError } = await (supabase as any)
        .from("applications")
        .insert({
          user_id: user.id,
          job_id: jobId,
          job_title: jobTitle,
          company_name: companyName,
          job_description: jobDescription,
          resume_version_id: targetResumeVersionId,
          fit_score: effectiveMatchScore,
          fit_level: fitLevel,
          matched_skills: analysis?.matched || [],
          partial_skills: analysis?.partial || [],
          missing_skills: analysis?.missing || [],
          fit_summary: fitVerdict,
          improvements: analysis?.improvements || [],
          status: "saved",
          applied_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (appError || !newApp) {
        console.error("Application create error:", appError);
        return NextResponse.json({ error: "Could not create application record." }, { status: 500 });
      }
      application = newApp;
    }

    // Link application_id back to tailoredVersion if generated
    if (tailoredVersion?.id && application?.id) {
      await (supabase as any)
        .from("resume_versions")
        .update({ application_id: application.id })
        .eq("id", tailoredVersion.id);
    }

    // 9. Automatically generate text-based interview preparation
    try {
      await generateInterviewPrep(application.id);
    } catch (prepErr) {
      console.error("Interview prep auto-generation error:", prepErr);
    }

    // 10. Automatically generate 15-question interview Q&A bank
    try {
      const { generateQABank } = await import("@/lib/actions/phase3");
      await generateQABank(application.id);
    } catch (qaErr) {
      console.error("Interview Q&A bank auto-generation error:", qaErr);
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      resumeId: targetResumeVersionId,
      tailoredResumeId: tailoredVersion?.id || null,
      isInterviewQualified,
      tailored: !isInterviewQualified
    });
  } catch (err: any) {
    console.error("create-from-landing error:", err);
    return NextResponse.json({ error: err.message || "Failed to process application" }, { status: 500 });
  }
}
