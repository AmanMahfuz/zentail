"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Requirement {
  requirement: string;
  type: string;
  importance: string;
  evidence: string;
  status: "found" | "partial" | "missing";
  suggestedAction: string;
}

export function RequirementTable({ requirements }: { requirements: Requirement[] }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "found": return <Badge className="bg-green-100 text-green-800">✅ Found</Badge>;
      case "partial": return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Partial</Badge>;
      case "missing": return <Badge className="bg-red-100 text-red-800">❌ Missing</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance.toLowerCase()) {
      case "high": return <Badge variant="destructive">High</Badge>;
      case "medium": return <Badge variant="secondary">Medium</Badge>;
      case "low": return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">{importance}</Badge>;
    }
  };

  const total = requirements.length;
  const found = requirements.filter(r => r.status === "found").length;
  const matchPercentage = total > 0 ? Math.round((found / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Requirement Map</CardTitle>
              <CardDescription>How your evidence stacks up against this specific job's requirements.</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{matchPercentage}%</div>
              <div className="text-sm text-muted-foreground">Evidence Match</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requirement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Importance</TableHead>
                <TableHead>Your Evidence</TableHead>
                <TableHead>Action Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((req, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{req.requirement}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{req.type}</TableCell>
                  <TableCell>{getImportanceBadge(req.importance)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(req.status)}
                      <p className="text-xs text-muted-foreground mt-1">{req.evidence}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.status !== 'found' ? req.suggestedAction : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
