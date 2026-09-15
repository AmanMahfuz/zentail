"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { addUserProject, deleteUserProject } from "@/lib/actions/evidence";

export function ProjectsList({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [skillsStr, setSkillsStr] = useState("");

  const handleAdd = async () => {
    if (!title) return;
    setLoading(true);
    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    const res = await addUserProject(title, description, githubUrl, liveUrl, skills);
    if (res.success) {
      setProjects([{ 
        id: Math.random().toString(), 
        title, 
        description, 
        github_url: githubUrl, 
        live_url: liveUrl, 
        skills_demonstrated: skills 
      }, ...projects]);
      setTitle("");
      setDescription("");
      setGithubUrl("");
      setLiveUrl("");
      setSkillsStr("");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    await deleteUserProject(id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Projects as Evidence</CardTitle>
          <CardDescription>Link projects to prove your skills to the AI and hiring managers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-6 border p-4 rounded-lg bg-slate-50">
            <h4 className="font-medium">Add New Project</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input placeholder="Project Title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input placeholder="Skills Demonstrated (comma separated)" value={skillsStr} onChange={e => setSkillsStr(e.target.value)} />
              </div>
            </div>
            <Textarea placeholder="Brief Description" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="GitHub URL" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
              <Input placeholder="Live URL" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={loading || !title}>Add Project</Button>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500">No projects added yet.</p>
            ) : (
              projects.map(project => (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">{project.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {project.skills_demonstrated?.map((skill: string) => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-3 flex gap-4 text-sm">
                        {project.github_url && (
                          <a href={project.github_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            GitHub
                          </a>
                        )}
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)} className="text-red-500 hover:text-red-700">
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
