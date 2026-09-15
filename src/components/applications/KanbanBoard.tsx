"use client";
import { ApplicationCard } from "./ApplicationCard";

interface Stage {
  key: string;
  label: string;
  color: string;
  bg: string;
  description: string;
}

interface Props {
  stages: Stage[];
  grouped: Record<string, any[]>;
}

export function KanbanBoard({ stages, grouped }: Props) {
  return (
    <div className="grid grid-cols-5 gap-3 overflow-x-auto min-w-[900px] pb-4">
      {stages.map(stage => {
        const cards = grouped[stage.key] || [];
        return (
          <div key={stage.key} className="flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ background: stage.color }}
                />
                <span className="text-sm font-medium">{stage.label}</span>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {cards.map(app => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  stageColor={stage.color}
                  stageBg={stage.bg}
                />
              ))}

              {/* Empty state */}
              {cards.length === 0 && (
                <div className="px-4 py-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  {stage.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
