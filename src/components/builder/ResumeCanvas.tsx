"use client";

import React, { forwardRef } from "react";
import { BuilderResumeData } from "@/types/resume-builder";
import BasicTemplate from "./templates/BasicTemplate";
import BalancedTemplate from "./templates/BalancedTemplate";
import FresherTemplate from "./templates/FresherTemplate";
import ExperiencedTemplate from "./templates/ExperiencedTemplate";
import HybridTemplate from "./templates/HybridTemplate";
import OriginalTemplate from "./templates/OriginalTemplate";

interface ResumeCanvasProps {
  data: BuilderResumeData;
  zoom?: number;
}

export const ResumeCanvas = forwardRef<HTMLDivElement, ResumeCanvasProps>(
  ({ data, zoom = 100 }, ref) => {
    const renderActiveTemplate = () => {
      switch (data.theme?.template) {
        case "original":
          return <OriginalTemplate data={data} />;
        case "fresher":
          return <FresherTemplate data={data} />;
        case "experienced":
          return <ExperiencedTemplate data={data} />;
        case "hybrid":
          return <HybridTemplate data={data} />;
        case "balanced":
          return <BalancedTemplate data={data} />;
        case "basic":
        default:
          return <BasicTemplate data={data} />;
      }
    };

    // Calculate margins based on ATS blueprint rules
    const getPadding = () => {
      if (data.theme?.margin === "0.5in" || data.theme?.template === "experienced") {
        return "12.7mm"; // 0.5 inch
      }
      if (data.theme?.margin === "0.75in" || data.theme?.template === "hybrid") {
        return "19.05mm"; // 0.75 inch
      }
      if (data.theme?.margin === "1.0in" || data.theme?.template === "fresher") {
        return "25.4mm"; // 1.0 inch
      }
      return "20mm 22mm";
    };

    const fontName = data.theme?.fontFamily || "Inter";
    const fontQuery = fontName.replace(/\s+/g, "+");
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontQuery}:wght@400;500;600;700;800&display=swap`;

    return (
      <>
        {/* Dynamic Google Font import */}
        <link rel="stylesheet" href={fontUrl} />

        {/* Global Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-resume-sheet,
            #printable-resume-sheet * {
              visibility: visible;
            }
            #printable-resume-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 20mm !important;
            }
          }
        `}</style>

        <div
          className="flex justify-center transition-transform duration-200 origin-top"
          style={{
            transform: `scale(${zoom / 100})`,
          }}
        >
          {/* A4 Sheet Container */}
          <div
            id="printable-resume-sheet"
            ref={ref}
            className="w-full bg-white transition-all"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: getPadding(),
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 35px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              boxSizing: "border-box",
            }}
          >
            {renderActiveTemplate()}
          </div>
        </div>
      </>
    );
  }
);

ResumeCanvas.displayName = "ResumeCanvas";
export default ResumeCanvas;
