"use client";
interface SkillGap {
  skill_name: string;
  required_in_count: number;
  user_has_it: boolean;
}

export function EvidenceGapsWidget({ skillGaps }: { skillGaps: SkillGap[] }) {
  if (!skillGaps.length) return null;

  const topGap = skillGaps[0];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm font-medium">Evidence gaps</div>
          <div className="text-xs text-zinc-500 mt-0.5">
            Skills missing across your active applications
          </div>
        </div>
        <a href="/skills" className="text-xs text-blue-600 hover:underline">
          View all
        </a>
      </div>

      {/* Top gap callout */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 mb-3">
        <div className="text-xs font-medium mb-1 text-zinc-900 dark:text-zinc-100">
          {skillGaps.length} of your target jobs require{" "}
          <strong>{topGap.skill_name}</strong>
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          Add a {topGap.skill_name} project to your Evidence Profile to
          instantly boost your fit score across {topGap.required_in_count} applications.
        </div>
        <div className="flex gap-2 mt-2.5">
          <a
            href={`/skills?learn=${encodeURIComponent(topGap.skill_name)}`}
            className="text-[11px] px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Learn {topGap.skill_name}
          </a>
          <a
            href="/profile/evidence"
            className="text-[11px] px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Add experience instead
          </a>
        </div>
      </div>

      {/* Other gaps */}
      <div className="flex flex-col gap-1.5">
        {skillGaps.slice(1, 4).map(gap => (
          <div
            key={gap.skill_name}
            className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{gap.skill_name}</span>
              <span className="text-[11px] text-zinc-500">
                {gap.required_in_count} jobs
              </span>
            </div>
            <a
              href={`/skills?learn=${encodeURIComponent(gap.skill_name)}`}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Learn →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
