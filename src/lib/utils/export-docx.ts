import { Document, Packer, Paragraph, TextRun } from "docx";

export async function exportResumeToDocx(resumeMarkdown: string, filename: string = "resume.docx") {
  // A very simple markdown to docx parser for MVP purposes.
  // In a real app, use a dedicated markdown-to-docx converter.
  const lines = resumeMarkdown.split("\n");
  
  const paragraphs = lines.map(line => {
    if (line.startsWith("# ")) {
      return new Paragraph({
        children: [new TextRun({ text: line.replace("# ", ""), bold: true, size: 32 })],
        spacing: { before: 200, after: 200 }
      });
    } else if (line.startsWith("## ")) {
      return new Paragraph({
        children: [new TextRun({ text: line.replace("## ", ""), bold: true, size: 28 })],
        spacing: { before: 400, after: 200 }
      });
    } else if (line.startsWith("### ")) {
      return new Paragraph({
        children: [new TextRun({ text: line.replace("### ", ""), bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
      });
    } else if (line.startsWith("- ")) {
      return new Paragraph({
        children: [new TextRun({ text: line.replace("- ", ""), size: 22 })],
        bullet: { level: 0 }
      });
    } else {
      return new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: 100 }
      });
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
