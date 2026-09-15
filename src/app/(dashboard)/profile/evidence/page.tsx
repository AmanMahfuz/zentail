import { getUserSkills, getUserProjects } from "@/lib/actions/evidence";
import { EvidenceList } from "@/components/profile/evidence-list";
import { ProjectsList } from "@/components/profile/projects-list";

export const metadata = {
  title: "Evidence Profile | Zentail",
  description: "Manage your skills and the projects that prove them.",
};

export default async function EvidenceProfilePage() {
  const [skills, projects] = await Promise.all([
    getUserSkills(),
    getUserProjects()
  ]);

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evidence Profile</h1>
        <p className="text-muted-foreground mt-2">
          Hiring managers don't just want a list of skills. They want proof. Link your skills to real evidence.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <EvidenceList initialSkills={skills} />
        </div>
        <div>
          <ProjectsList initialProjects={projects} />
        </div>
      </div>
    </div>
  );
}
