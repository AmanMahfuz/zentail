const fs = require('fs');

const oldPage = fs.readFileSync('src/old_marketing_page.tsx', 'utf-8');
const newPage = fs.readFileSync('src/app/(marketing)/page.tsx', 'utf-8');

// Extract the jd input UI from newPage
const jdInputMatch = newPage.match(/\{!\?result \? \(\n\s*<motion\.div[\s\S]*?\)(?= \: \(\n\s*\/\* PARTIAL RESULT)/);
const jdInputStr = newPage.substring(newPage.indexOf("{/* THE MAIN INPUT - No signup needed */}"), newPage.indexOf("</main>"));

// Extract the state variables from newPage
const stateVars = `
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    fitScore: number;
    matched: string[];
    missing: string[];
    verdict: string;
  }>(null);
  const router = useRouter();

  const analyzeJD = async () => {
    if (!jd.trim() || jd.length < 50) return;
    setLoading(true);

    try {
      const response = await fetch("/api/public/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd })
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ fitScore: 0, matched: [], missing: [], verdict: "Create a free account to see your full analysis." });
    } finally {
      setLoading(false);
    }
  };
`;

// Replace state inside oldPage
let merged = oldPage.replace(/export default function LandingPage\(\) \{\n  return \(/, `export default function LandingPage() {\n${stateVars}\n  return (`);

// Also need to add useRouter to imports if not there
if (!merged.includes('useRouter')) {
    merged = merged.replace(/import Link from "next\/link"/, `import { useRouter } from "next/navigation";\nimport Link from "next/link"`);
}
// Ensure useState is imported
if (!merged.includes('useState')) {
    merged = merged.replace(/"use client"\n/, `"use client"\n\nimport { useState } from "react";\n`);
}

// Now replace the right column Kanban mockup with jdInputStr
const startIdx = merged.indexOf('{/* Hero Graphic - Kanban Board Mockup */}');
const endIdx = merged.indexOf('</section>');

if (startIdx !== -1 && endIdx !== -1) {
    const sectionEnd = merged.lastIndexOf('</motion.div>', merged.lastIndexOf('</motion.div>', endIdx) - 1) + 14;
    // Just slice out from startIdx to sectionEnd, replace with jdInputStr
    const before = merged.substring(0, startIdx);
    const after = merged.substring(endIdx);
    
    // wait, jdInputStr contains its own surrounding div that we want to place in the right column
    // let's wrap jdInputStr to fit the right column
    const rightCol = `
              <div className="w-full max-w-lg mx-auto lg:max-w-none relative z-20">
                ${jdInputStr.replace('</main>', '')}
              </div>
    `;
    
    merged = before + rightCol + '\n            </div>\n          </div>\n        ' + after;
}

fs.writeFileSync('src/app/(marketing)/page.tsx', merged);
console.log('Merged successfully!');
