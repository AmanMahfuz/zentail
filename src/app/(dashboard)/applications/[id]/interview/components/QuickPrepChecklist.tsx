"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function QuickPrepChecklist() {
  const [items, setItems] = useState([
    { id: 1, text: "Review JavaScript Event Loop & Async/Await execution", done: true },
    { id: 2, text: "Prepare REST API vs GraphQL tradeoff talking points", done: true },
    { id: 3, text: "Review database indexing, B-Trees & PostgreSQL queries", done: false },
    { id: 4, text: "Ready 90-second self-introduction & project architectural walkthrough", done: false },
  ]);

  const toggleItem = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const doneCount = items.filter(i => i.done).length;

  return (
    <Card className="border-slate-200 shadow-sm mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            Quick Prep Checklist
          </CardTitle>
          <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {doneCount} of {items.length} Done
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <Checkbox 
                id={`prep-${item.id}`} 
                checked={item.done}
                onCheckedChange={() => toggleItem(item.id)}
                className={item.done ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"}
              />
              <label 
                htmlFor={`prep-${item.id}`}
                className={`text-xs leading-relaxed cursor-pointer transition-colors ${
                  item.done ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              >
                {item.text}
              </label>
            </div>
          ))}
        </div>
        
        <Button variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 justify-start px-2 text-xs font-medium">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add personal preparation item
        </Button>
      </CardContent>
    </Card>
  );
}
