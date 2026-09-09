"use client";

export function ResumeCanvas({ activeResume }: { activeResume: any }) {
  // We use Tailwind to style it exactly like the mockup paper
  return (
    <div className="bg-white shadow-2xl shadow-slate-300/50 w-[850px] aspect-[8.5/11] p-16 flex flex-col font-serif text-slate-800 relative">
      
      {/* Name and Contact (Header) */}
      <div className="flex justify-between items-end border-b-2 border-slate-300 pb-4 mb-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 uppercase">Alex John</h1>
          <h2 className="text-lg font-semibold text-blue-600 mt-2">Frontend Developer & UI Systems Specialist</h2>
        </div>
        <div className="text-right text-sm font-sans text-slate-600 space-y-0.5">
          <p>alex.john@example.com • +1 (555) 019-2834</p>
          <p>San Francisco, CA • linkedin.com/in/alexjohn</p>
          <p>github.com/alexjohn</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-100 pb-1">Professional Summary</h3>
        <p className="text-sm leading-relaxed text-slate-700">
          Performance-driven Frontend Engineer with 2+ years of production experience crafting accessible, responsive web interfaces with React, Next.js, and modern TypeScript. Proven track record of optimizing Core Web Vitals, reducing bundle sizes, and translating high-fidelity designs into seamless user experiences. Passionate about modular UI architectures and clean, deterministic engineering standards.
        </p>
      </div>

      {/* Experience */}
      <div className="mb-6 relative">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-100 pb-1">Professional Experience</h3>
        
        {/* Active Section Selection Box indicator (from mockup) */}
        <div className="absolute -inset-x-4 -inset-y-2 border-2 border-dashed border-blue-200 bg-blue-50/10 pointer-events-none rounded-lg z-0" />
        
        <div className="mb-5 relative z-10">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-bold text-slate-900 text-sm">PixelCraft Studios</h4>
            <span className="text-xs text-slate-500 font-mono tracking-tighter">06/2023 - Present</span>
          </div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="italic text-slate-700 text-sm">Junior Frontend Engineer</span>
            <span className="italic text-slate-500 text-sm">San Francisco, CA</span>
          </div>
          <ul className="list-disc list-outside ml-4 text-sm text-slate-700 space-y-1.5 marker:text-slate-400">
            <li>Architected and deployed 18+ responsive component libraries using React 18 and Tailwind CSS, standardizing cross-platform accessibility (WCAG 2.1 AA compliant).</li>
            <li>Collaborated with design leads to migrate legacy CSS modules to atomic utilities, decreasing production CSS bundle size by 38%.</li>
            <li>Integrated automated end-to-end testing with Playwright, catching 40+ pre-release regressions and accelerating release cadence by 2 days per sprint.</li>
          </ul>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-bold text-slate-900 text-sm">DataPulse Technologies</h4>
            <span className="text-xs text-slate-500 font-mono tracking-tighter">01/2022 - 05/2023</span>
          </div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="italic text-slate-700 text-sm">Web Development Intern</span>
            <span className="italic text-slate-500 text-sm">Remote</span>
          </div>
          <ul className="list-disc list-outside ml-4 text-sm text-slate-700 space-y-1.5 marker:text-slate-400">
            <li>Refactored interactive dashboard data visualizations using Chart.js and React Query, reducing data fetch latency by 24%.</li>
            <li>Authored comprehensive internal documentation for client-side state caching strategies adopted across 3 development teams.</li>
          </ul>
        </div>
      </div>

      {/* Projects */}
      <div className="mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Highlighted Projects</h3>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-sm">Acme Match: 98%</span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-bold text-slate-900 text-sm">Interactive E-Commerce Component Suite</h4>
            <span className="text-xs font-mono text-slate-500">TypeScript, React, Tailwind CSS, Vite</span>
          </div>
          <p className="text-sm text-slate-700">
            Engineered a zero-runtime headless UI design system with fully typed polymorphic components, achieving 100/100 Lighthouse performance and supporting 45+ customizable theme variables.
          </p>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-bold text-slate-900 text-sm">Distributed Job Search Pipeline Visualizer</h4>
            <span className="text-xs font-mono text-slate-500">Next.js 14, Zustand, Supabase, Tailwind</span>
          </div>
        </div>
      </div>

    </div>
  );
}
