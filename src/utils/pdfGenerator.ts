import { jsPDF } from "jspdf";
import { ParsedMinutes } from "../parser";

/**
 * Text utility to scrub raw markdown tokens (e.g. bold markers, backticks, empty quote sequences)
 * and normalize punctuation for a clean executive layout.
 */
function cleanText(text: string): string {
  if (!text || text === "N/A") return "N/A";
  
  // 1. Strip emojis and special ranges of symbols that aren't ANSI compatible
  let cleaned = text
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/\*\*/g, "") // Remove bold indicators
    .replace(/\*/g, "")   // Remove italics / lists
    .replace(/`/g, "")    // Remove backticks
    .replace(/_([^_]+)_/g, "$1") // Remove underscores denoting italics
    .replace(/\\"/g, '"') // Normalize escaped double quotes
    .replace(/""/g, '"');  // Strip duplicated double quotes

  // 2. Map wide unicode quotes, dashes or other common styling bullets to safe ASCII / Latin1 alternatives
  let finalStr = "";
  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i);
    if ((code >= 32 && code <= 126) || (code >= 192 && code <= 255) || code === 9 || code === 10 || code === 13) {
      finalStr += cleaned[i];
    } else {
      if (code === 8220 || code === 8221) {
        finalStr += '"';
      } else if (code === 8216 || code === 8217) {
        finalStr += "'";
      } else if (code === 8211 || code === 8212 || code === 8226) {
        finalStr += "-";
      } else if (code === 160) {
        finalStr += " "; // non-breaking space
      } else if (code === 10003 || code === 10004 || code === 2713 || code === 2714) {
        finalStr += "[OK]";
      } else if (code === 9888) {
        finalStr += "[Warning]";
      } else if (code === 10140 || code === 10141 || code === 8594) {
        finalStr += "->";
      } else {
        // drop other characters to prevent junk text in standard Helvetica encoding
      }
    }
  }
  return finalStr.trim();
}

/**
 * Custom PDF Generation Utility with precise layout flow and automatic page-breaking.
 */
export function exportMinutesToPDF(data: ParsedMinutes) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10; // Maximized standard margins (10mm / 1cm) to utilize the page limits to the absolute fullest
  const contentWidth = pageWidth - margin * 2; // 190mm of printable content width
  let y = 22; // Start higher to utilize page space to its absolute ceiling
  let pageNumber = 1;

  // Draw Header and Footer helper
  const drawPageDecorations = (pdf: jsPDF) => {
    // Header text
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(113, 113, 122); // zinc-500
    pdf.text("TRANSCRIPTAI  •  MEETING SUMMARY REPORT", margin, 13);
    
    pdf.setFont("Helvetica", "normal");
    const docTypeStr = "EXECUTIVE DOSSIER";
    const docTypeWidth = pdf.getTextWidth(docTypeStr);
    pdf.text(docTypeStr, pageWidth - margin - docTypeWidth, 13);

    // Header divider line
    pdf.setDrawColor(228, 228, 231); // zinc-200
    pdf.setLineWidth(0.3);
    pdf.line(margin, 15, pageWidth - margin, 15);

    // Footer divider line & text
    pdf.setDrawColor(228, 228, 231);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("CONFIDENTIAL  •  TEMPORALLY ARCHIVED", margin, pageHeight - 8);
    
    const pageNumStr = `Page ${pageNumber}`;
    const pageNumWidth = pdf.getTextWidth(pageNumStr);
    pdf.text(pageNumStr, pageWidth - margin - pageNumWidth, pageHeight - 8);
  };

  /**
   * Safe content wrapper to print text with automatic margins & page splitting.
   * Leverages a fixed leftIndent to completely prevent negative offset width calculations.
   */
  const printText = (
    text: string,
    fontSize: number = 10,
    fontStyle: "normal" | "bold" | "italic" = "normal",
    color: [number, number, number] = [39, 39, 42],
    lineHeightBonus: number = 0,
    leftIndent: number = 0
  ) => {
    doc.setFont("Helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    // Indent cannot realistically exceed 60mm; keeps a comfortable minimum of 110mm bounds.
    const activeWidth = Math.max(contentWidth - leftIndent, 50);
    const cleaned = cleanText(text);
    
    // Split on raw newline characters first to prevent wrapping/line issues with multi-line paragraphs
    const paragraphs = cleaned.split("\n");
    
    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;
      
      const lines = doc.splitTextToSize(trimmedPara, activeWidth);
      for (const line of lines) {
        if (y > pageHeight - 15) { // Use bottom limit extensively (underneath the footer border which is at pageHeight - 12)
          doc.addPage();
          pageNumber++;
          y = 20; // Start high on subsequent pages
          drawPageDecorations(doc);
          
          // Restore styles for current operation
          doc.setFont("Helvetica", fontStyle);
          doc.setFontSize(fontSize);
          doc.setTextColor(color[0], color[1], color[2]);
        }
        doc.text(line, margin + leftIndent, y);
        y += fontSize * 0.35 + 1.2 + lineHeightBonus;
      }
    }
  };

  /**
   * Helper to draw a modern callout box (e.g., Executive Summary) with high-contrast layout.
   * Splits across pages beautifully and safely.
   */
  const drawCallout = (title: string, bodyText: string) => {
    // Left border accent color: indigo [79, 70, 229]
    // Background color: light grey [249, 250, 251]
    
    // Proactively page-break if y is too low to prevent orphaned section titles or tiny start segments
    if (y > pageHeight - 35) {
      doc.addPage();
      pageNumber++;
      y = 20;
      drawPageDecorations(doc);
    }
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(79, 70, 229);
    doc.text(title, margin, y);
    y += 4.5;
    
    const cleanedBody = cleanText(bodyText);
    // Explicitly set matching body fonts FIRST before calculating splitTextToSize so that
    // jsPDF uses correct 9.0pt normal dimensions for split computations, preventing wide gaps
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.0);
    const bodyLines = doc.splitTextToSize(cleanedBody, contentWidth - 4.5);
    
    let i = 0;
    const itemLineHeight = 4.0; // tighter modern layout line height (highly visual and compact)
    
    while (i < bodyLines.length) {
      // Find how many lines fit on the current page
      const maxAvailableSpace = (pageHeight - 14) - y;
      const linesThatFit = Math.max(1, Math.floor(maxAvailableSpace / itemLineHeight));
      const chunkCount = Math.min(linesThatFit, bodyLines.length - i);
      
      if (chunkCount <= 0) {
        doc.addPage();
        pageNumber++;
        y = 20;
        drawPageDecorations(doc);
        continue;
      }
      
      const chunkLines = bodyLines.slice(i, i + chunkCount);
      const boxHeight = chunkLines.length * itemLineHeight + 2.5; // minimal top/bottom padding to maximize utility
      
      // Draw background panel strip spanning across the whole page content width
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 1, contentWidth, boxHeight, "F");
      
      // Draw left accent vertical bar
      doc.setFillColor(79, 70, 229);
      doc.rect(margin, y - 1, 1.2, boxHeight, "F");
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.0);
      doc.setTextColor(63, 63, 70); // zinc-700
      
      let currentLineY = y + 2.2; // offset inside the callout block
      for (const line of chunkLines) {
        // Just 2.5mm from the left edge (clears the 1.2mm vertical bar nicely)
        doc.text(line, margin + 2.5, currentLineY);
        currentLineY += itemLineHeight;
      }
      
      y += boxHeight + 2.5; // Tighter bottom margins layout to avoid wasting space underneath
      i += chunkCount;
      
      if (i < bodyLines.length) {
        doc.addPage();
        pageNumber++;
        y = 20;
        drawPageDecorations(doc);
      }
    }
  };

  // 1. First Page Setup
  drawPageDecorations(doc);

  // Document Title Header Banner
  y = 22; // Start higher to utilize page space to its absolute ceiling
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18); // Modern elegant size to ensure clean line wrapping and minimal spacing
  doc.setTextColor(79, 70, 229); // brand indigo
  
  const cleanTopic = cleanText(data.metadata.topic !== "N/A" ? data.metadata.topic : "Meeting Summary Intelligence Report");
  const topicLines = doc.splitTextToSize(cleanTopic, contentWidth);
  for (const line of topicLines) {
    if (y > pageHeight - 15) {
      doc.addPage();
      pageNumber++;
      y = 20;
      drawPageDecorations(doc);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
    }
    doc.text(line, margin, y);
    y += 7.5; // highly compact line flow
  }
  y += 2;

  // Compact modern metadata line right below the title (saves massive space!)
  let metaParts: string[] = [];
  if (data.metadata.dateTime && data.metadata.dateTime !== "N/A") {
    metaParts.push(`Date/Time: ${cleanText(data.metadata.dateTime)}`);
  }
  if (data.metadata.attendees && data.metadata.attendees.length > 0) {
    const cleanAttendees = data.metadata.attendees.map(a => cleanText(a)).filter(a => a !== "N/A").join(", ");
    if (cleanAttendees) {
      metaParts.push(`Participants: ${cleanAttendees}`);
    }
  }

  if (metaParts.length > 0) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(113, 113, 122); // zinc-500
    
    const metaString = metaParts.join("   |   ");
    const metaLines = doc.splitTextToSize(metaString, contentWidth);
    for (const mLine of metaLines) {
      if (y > pageHeight - 15) {
        doc.addPage();
        pageNumber++;
        y = 20;
        drawPageDecorations(doc);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(113, 113, 122);
      }
      doc.text(mLine, margin, y);
      y += 4.5;
    }
    y += 3; // micro margin spacer
  }

  // 2. Executive Summary Callout Panel
  if (data.summary && data.summary !== "N/A") {
    drawCallout("EXECUTIVE SUMMARY BRIEF", data.summary);
  }

  // 3. Discussion Pillars (if present)
  if (data.pillars && data.pillars.length > 0) {
    printText("KEY DISCUSSION PILLARS & CONTEXTS", 12, "bold", [79, 70, 229], 1.5);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 3;

    for (const pillar of data.pillars) {
      if (y > pageHeight - 15) {
        doc.addPage();
        pageNumber++;
        y = 20;
        drawPageDecorations(doc);
      }

      printText(`Pillar ${pillar.index}: ${pillar.title}`, 10.5, "bold", [30, 27, 75], 0.5);
      y += 1;

      printText(`• Context: ${pillar.context}`, 9.5, "normal", [82, 82, 91], 0.3, 4);
      printText(`• Perspectives: ${pillar.perspectives}`, 9.5, "normal", [120, 53, 4], 0.3, 4); // warm amber
      printText(`• Resolution: ${pillar.resolution}`, 9.5, "normal", [6, 78, 59], 0.3, 4); // deep teal
      y += 3; // buffer space
    }
    y += 2;
  }

  // 4. Action Items Checklist Matrix
  if (data.actionItems && data.actionItems.length > 0) {
    if (y > pageHeight - 15) {
      doc.addPage();
      pageNumber++;
      y = 20;
      drawPageDecorations(doc);
    }

    printText("ASSIGNED WORK & ACTIONS MATRIX", 12, "bold", [79, 70, 229], 1.5);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 4;

    for (const action of data.actionItems) {
      if (y > pageHeight - 15) {
        doc.addPage();
        pageNumber++;
        y = 20;
        drawPageDecorations(doc);
      }

      // Checkbox state [X] or [ ]
      const statusSymbol = action.completed ? "[X]" : "[ ]";
      const statusColor: [number, number, number] = action.completed ? [16, 124, 65] : [220, 38, 38];

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusSymbol, margin, y);

      const ownerAndTask = `${action.owner}: ${action.task}`;
      printText(ownerAndTask, 9.5, "normal", [63, 63, 70], 0.3, 10);
      y += 1.5;
    }
    y += 3;
  }

  // 5. Decisions & Risks Logger
  if (data.decisionsRisks && (data.decisionsRisks.decisions.length > 0 || data.decisionsRisks.risks.length > 0)) {
    if (y > pageHeight - 15) {
      doc.addPage();
      pageNumber++;
      y = 20;
      drawPageDecorations(doc);
    }

    printText("DECISIONS CONCLUDED & BLOCKERS LOGGER", 12, "bold", [79, 70, 229], 1.5);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 4;

    // Decisions Concluded
    if (data.decisionsRisks.decisions.length > 0) {
      printText("• Concluded Resolutions", 10, "bold", [6, 95, 70], 0.5);
      y += 1;
      for (const dec of data.decisionsRisks.decisions) {
        printText(`•  ${dec}`, 9.5, "normal", [39, 39, 42], 0.3, 4);
      }
      y += 3;
    }

    // Risks Flagged
    if (data.decisionsRisks.risks.length > 0) {
      printText("• Risks or Blockers Logged", 10, "bold", [185, 28, 28], 0.5);
      y += 1;
      for (const risk of data.decisionsRisks.risks) {
        printText(`•  ${risk}`, 9.5, "normal", [39, 39, 42], 0.3, 4);
      }
      y += 3;
    }
  }

  // 6. Chronological Reference Timeline
  if (data.timeline && data.timeline.length > 0) {
    if (y > pageHeight - 15) {
      doc.addPage();
      pageNumber++;
      y = 20;
      drawPageDecorations(doc);
    }

    printText("CHRONOLOGICAL SYNC TIMELINE", 12, "bold", [79, 70, 229], 1.5);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 4;

    for (const event of data.timeline) {
      if (y > pageHeight - 15) {
        doc.addPage();
        pageNumber++;
        y = 20;
        drawPageDecorations(doc);
      }

      // Draw timeline time stamp
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229); // Brand color
      
      const cleanTime = cleanText(event.time);
      const timeStr = `[${cleanTime}]`;
      doc.text(timeStr, margin, y);

      printText(event.event, 9.5, "normal", [63, 63, 70], 0.3, 18);
      y += 1.5;
    }
  }

  // Save download operations
  const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  };

  const formattedTopic = data.metadata.topic !== "N/A" ? sanitizeFileName(data.metadata.topic) : "meeting";
  doc.save(`transcriptai_${formattedTopic}_minutes.pdf`);
}

/**
 * Downloads a well-formatted dialogue transcript PDF file directly.
 */
export function exportRawTranscriptToPDF(topic: string, fullTranscriptText: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10; // Unified 10mm margins for absolute maximum coverage
  const contentWidth = pageWidth - margin * 2;
  let y = 22; // Start higher to prevent gaps
  let pageNumber = 1;

  const drawPageDecorations = (pdf: jsPDF) => {
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(113, 113, 122);
    pdf.text("TRANSCRIPTAI  •  RAW AUDIO SESSION LOG", margin, 13);
    
    pdf.setFont("Helvetica", "normal");
    const transTypeStr = "DIALOGUE TIMELINE";
    const transTypeWidth = pdf.getTextWidth(transTypeStr);
    pdf.text(transTypeStr, pageWidth - margin - transTypeWidth, 13);

    pdf.setDrawColor(228, 228, 231);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 15, pageWidth - margin, 15);

    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    pdf.text("UNSTRUCTURED AUDIT FEED LOG", margin, pageHeight - 8);
    
    const pageNumStr = `Page ${pageNumber}`;
    const pageNumWidth = pdf.getTextWidth(pageNumStr);
    pdf.text(pageNumStr, pageWidth - margin - pageNumWidth, pageHeight - 8);
  };

  drawPageDecorations(doc);

  // Document Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(39, 39, 42);
  doc.text("Meeting Session Dialogue Feed", margin, y);
  y += 7;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(113, 113, 122);
  doc.text(`Topic Reference: ${cleanText(topic) || "Live Schedules Workspace"}`, margin, y);
  y += 10;

  // Split transcript by line and output elegant blocks
  const transcriptLinesRaw = fullTranscriptText.split("\n");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27); // deep zinc

  for (const rawLine of transcriptLinesRaw) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;

    // Clean markdown characters from raw speech
    const cleanedSpeechLine = cleanText(trimmedLine);
    const wrappedLines = doc.splitTextToSize(cleanedSpeechLine, contentWidth);
    
    for (const wrapped of wrappedLines) {
      if (y > pageHeight - 15) {
        doc.addPage();
        pageNumber++;
        y = 20;
        drawPageDecorations(doc);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(24, 24, 27);
      }

      // Check if line contains a timestamp/speaker key e.g., [00:01:10] and color it nicely
      const timestampMatch = wrapped.match(/^(\[\d{2}:\d{2}:\d{2}\])\s*(.*)/);
      if (timestampMatch) {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(79, 70, 229); // brand indigo
        doc.text(timestampMatch[1], margin, y);
        
        const timestampOffset = doc.getTextWidth(timestampMatch[1] + " ");
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(24, 24, 27);
        doc.text(timestampMatch[2], margin + timestampOffset, y);
      } else {
        doc.text(wrapped, margin, y);
      }

      y += 5.2; // line height spacing
    }
    y += 1.5; // paragraph gap
  }

  const cleanTitle = (topic || "session").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`transcriptai_${cleanTitle}_raw_transcript.pdf`);
}
