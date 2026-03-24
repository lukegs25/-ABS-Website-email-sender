"use client";

import { useRef, useCallback } from "react";
import { Download } from "lucide-react";

const BYU_BLUE = "#002e5d";
const GOLD = "#c5a44e";

export default function Certificate({ memberName, eventsAttended, completionDate }) {
  const canvasRef = useRef(null);

  const drawCertificate = useCallback(
    (canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W = 1200;
      const H = 850;
      canvas.width = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // Border
      ctx.strokeStyle = BYU_BLUE;
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, W - 60, H - 60);

      // Inner border
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, W - 80, H - 80);

      // Top accent bar
      ctx.fillStyle = BYU_BLUE;
      ctx.fillRect(60, 60, W - 120, 8);

      // "AI in Business Society" header
      ctx.fillStyle = BYU_BLUE;
      ctx.font = "600 16px 'Geist Sans', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("AI IN BUSINESS SOCIETY  •  BRIGHAM YOUNG UNIVERSITY", W / 2, 105);

      // Title
      ctx.fillStyle = BYU_BLUE;
      ctx.font = "700 42px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText("AI Proficiency Certificate", W / 2, 185);

      // Gold line under title
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(350, 200);
      ctx.lineTo(850, 200);
      ctx.stroke();

      // "This certifies that"
      ctx.fillStyle = "#666666";
      ctx.font = "400 18px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText("This certifies that", W / 2, 260);

      // Member name
      ctx.fillStyle = BYU_BLUE;
      ctx.font = "700 36px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText(memberName || "Member", W / 2, 315);

      // Gold line under name
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(300, 330);
      ctx.lineTo(900, 330);
      ctx.stroke();

      // Body text
      ctx.fillStyle = "#333333";
      ctx.font = "400 17px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText(
        `has demonstrated commitment to artificial intelligence by attending`,
        W / 2,
        385
      );
      ctx.fillText(
        `${eventsAttended || 5} AI in Business Society meetings at Brigham Young University,`,
        W / 2,
        415
      );
      ctx.fillText(
        "earning proficiency recognition and access to premier AI recruiting.",
        W / 2,
        445
      );

      // Date
      const dateStr =
        completionDate ||
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      ctx.fillStyle = "#666666";
      ctx.font = "400 15px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText(dateStr, W / 2, 510);

      // Signature section — left side (advisor)
      ctx.strokeStyle = "#999999";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, 640);
      ctx.lineTo(520, 640);
      ctx.stroke();

      ctx.fillStyle = BYU_BLUE;
      ctx.font = "italic 22px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText("Dr. James Gaskin", 360, 630);

      ctx.fillStyle = "#666666";
      ctx.font = "400 14px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText("Dr. James Gaskin", 360, 660);
      ctx.fillText("Faculty Advisor, AI in Business Society", 360, 680);

      // Signature section — right side (organization)
      ctx.strokeStyle = "#999999";
      ctx.beginPath();
      ctx.moveTo(680, 640);
      ctx.lineTo(1000, 640);
      ctx.stroke();

      ctx.fillStyle = "#666666";
      ctx.font = "400 14px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText("AI in Business Society", 840, 660);
      ctx.fillText("Marriott School of Business, BYU", 840, 680);

      // Bottom accent bar
      ctx.fillStyle = BYU_BLUE;
      ctx.fillRect(60, H - 68, W - 120, 8);

      // Bottom text
      ctx.fillStyle = "#999999";
      ctx.font = "400 12px 'Geist Sans', system-ui, sans-serif";
      ctx.fillText("aiinbusinesssociety.org", W / 2, H - 42);
    },
    [memberName, eventsAttended, completionDate]
  );

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCertificate(canvas);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ABS-AI-Proficiency-Certificate-${(memberName || "member").replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <canvas
          ref={(el) => {
            canvasRef.current = el;
            if (el) drawCertificate(el);
          }}
          className="w-full"
          style={{ aspectRatio: "1200/850" }}
        />
      </div>

      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--byu-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        <Download size={16} />
        Download Certificate
      </button>
    </div>
  );
}
