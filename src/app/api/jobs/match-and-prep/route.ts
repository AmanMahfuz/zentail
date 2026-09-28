import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchResumesAgainstJob, MatcherResumeInput } from "@/lib/services/resume-matcher";
import { generateQABankForRole } from "@/lib/services/qa-generator";
import { JobPostingInput, MatchAndPrepResult } from "@/types/resume-matching";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as JobPostingInput;
    const { title, company, description, applicationId, jobId, targetResumeId } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, message: "Job description is required" },
        { status: 400 }
      );
    }

    const cleanTitle = title?.trim() || "Software Engineer";
    const cleanCompany = company?.trim() || "Target Company";

    // 1. Fetch user resumes
    let resumeQuery = (supabase as any)
      .from("resume_versions")
      .select("id, version_label, version_number, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (targetResumeId) {
      resumeQuery = resumeQuery.eq("id", targetResumeId);
    }

    const { data: rawResumes, error: resumeErr } = await resumeQuery;
    if (resumeErr) {
      console.error("Failed to fetch resumes:", resumeErr);
    }

    const candidateResumes: MatcherResumeInput[] = (rawResumes || []).map((r: any) => ({
      id: r.id,
      versionLabel: r.version_label || `Resume v${r.version_number}`,
      versionNumber: r.version_number || 1,
      content: r.content || {}
    }));

    // 2. Run Resume Matcher
    const recommendation = await matchResumesAgainstJob(
      cleanTitle,
      cleanCompany,
      description,
      candidateResumes
    );

    // 3. Find the best resume content to ground the Q&A generation
    const winningResume = candidateResumes.find(r => r.id === recommendation.bestResumeId);

    // 4. Generate 14-15 customized Q&A bank questions
    const qaBank = await generateQABankForRole(
      cleanTitle,
      cleanCompany,
      description,
      winningResume?.content
    );

    // 5. Persist to database
    let savedRecId: string | undefined;

    const { data: recRow, error: recErr } = await (supabase as any)
      .from("resume_recommendations")
      .insert({
        user_id: user.id,
        application_id: applicationId || null,
        job_id: jobId || null,
        job_title: cleanTitle,
        company_name: cleanCompany,
        job_description: description,
        best_resume_id: recommendation.bestResumeId,
        best_resume_label: recommendation.bestResumeLabel,
        match_score: recommendation.matchScore,
        matched_skills: recommendation.matchedSkills,
        missing_skills: recommendation.missingSkills,
        recommendation_type: recommendation.recommendationType,
        explanation: recommendation.explanation,
        tailoring_suggestions: recommendation.tailoringSuggestions
      })
      .select("id")
      .single();

    if (!recErr && recRow) {
      savedRecId = recRow.id;
      recommendation.id = savedRecId;
    } else {
      console.error("Error saving recommendation:", recErr);
    }

    // Save QA bank to DB
    const { data: qaRow, error: qaErr } = await (supabase as any)
      .from("qa_banks")
      .insert({
        user_id: user.id,
        application_id: applicationId || null,
        recommendation_id: savedRecId || null,
        job_title: cleanTitle,
        company_name: cleanCompany,
        resume_id: recommendation.bestResumeId,
        total_questions: qaBank.totalQuestions,
        questions: qaBank.questions
      })
      .select("id")
      .single();

    if (!qaErr && qaRow) {
      qaBank.id = qaRow.id;
      qaBank.recommendationId = savedRecId;
    } else {
      console.error("Error saving QA bank:", qaErr);
    }

    // Optional: If tied to an application, update application's fit_score & matched_skills
    if (applicationId) {
      await (supabase as any)
        .from("applications")
        .update({
          fit_score: recommendation.matchScore,
          fit_level: recommendation.matchScore >= 80 ? "strong" : recommendation.matchScore >= 60 ? "moderate" : "weak",
          matched_skills: recommendation.matchedSkills,
          missing_skills: recommendation.missingSkills,
          resume_version_id: recommendation.bestResumeId
        })
        .eq("id", applicationId)
        .eq("user_id", user.id);
    }

    const result: MatchAndPrepResult = {
      success: true,
      recommendation,
      qaBank
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in match-and-prep route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process match and Q&A bank" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");
    const recommendationId = searchParams.get("recommendationId");

    let recQuery = (supabase as any)
      .from("resume_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (recommendationId) {
      recQuery = recQuery.eq("id", recommendationId);
    } else if (applicationId) {
      recQuery = recQuery.eq("application_id", applicationId);
    }

    const { data: recommendations, error: recErr } = await recQuery.limit(1);
    if (recErr) throw recErr;

    const latestRec = recommendations?.[0];
    if (!latestRec) {
      return NextResponse.json({ success: false, message: "No recommendations found" });
    }

    // Fetch corresponding QA bank
    const { data: qaBanks } = await (supabase as any)
      .from("qa_banks")
      .select("*")
      .eq("user_id", user.id)
      .eq("recommendation_id", latestRec.id)
      .limit(1);

    return NextResponse.json({
      success: true,
      recommendation: latestRec,
      qaBank: qaBanks?.[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
