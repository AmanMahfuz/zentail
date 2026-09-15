"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { addUserSkill, deleteUserSkill, updateUserSkill } from "@/lib/actions/evidence";

export function EvidenceList({ initialSkills }: { initialSkills: any[] }) {
  const [skills, setSkills] = useState(initialSkills);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newSkill) return;
    setLoading(true);
    const res = await addUserSkill(newSkill);
    if (res.success) {
      setSkills([{ id: Math.random().toString(), skill_name: newSkill, proof_status: "self_reported" }, ...skills]);
      setNewSkill("");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
    await deleteUserSkill(id);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setSkills(skills.map(s => s.id === id ? { ...s, proof_status: status } : s));
    await updateUserSkill(id, { proof_status: status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-100 text-green-800">✅ Verified</Badge>;
      case "linked": return <Badge className="bg-blue-100 text-blue-800">🔗 Linked</Badge>;
      case "learning": return <Badge className="bg-yellow-100 text-yellow-800">📚 Learning</Badge>;
      case "missing": return <Badge className="bg-red-100 text-red-800">❌ Missing</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">📝 Self-reported</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skill Evidence</CardTitle>
          <CardDescription>Add your skills and verify them with evidence to strengthen your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input 
              placeholder="e.g. React, Docker, System Design" 
              value={newSkill} 
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={loading || !newSkill}>Add Skill</Button>
          </div>

          <div className="space-y-4">
            {skills.length === 0 ? (
              <p className="text-sm text-gray-500">No skills added yet.</p>
            ) : (
              skills.map(skill => (
                <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{skill.skill_name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {skill.proof_description || "No proof provided yet. Add a project to link evidence."}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(skill.proof_status)}
                    <Select 
                      defaultValue={skill.proof_status} 
                      onValueChange={(v) => handleStatusChange(skill.id, v)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self_reported">Self Reported</SelectItem>
                        <SelectItem value="linked">Linked</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(skill.id)} className="text-red-500 hover:text-red-700">
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
