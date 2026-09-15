import Editor from '@monaco-editor/react';
import { Button } from "@/components/ui/button";

export function CodeWorkspace({
  value,
  onChange,
  onSubmit,
  isLoading
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="h-[400px] border border-slate-200 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 }
          }}
        />
      </div>
      <div className="flex justify-end gap-2 text-sm text-slate-500 mb-2">
        <span>Please provide your implementation and reasoning in the comments.</span>
      </div>
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !value.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isLoading ? "Evaluating Code..." : "Submit Code & Explanation"}
      </Button>
    </div>
  );
}
