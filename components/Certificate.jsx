"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Download, FileImage, FileText, Linkedin } from "lucide-react";

const BYU_BLUE = "#002e5d";
const GOLD = "#c5a44e";
const BG_WHITE = "#faf8f3";

// Google Fonts loaded for canvas use
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SCRIPT = "'Dancing Script', cursive";
const SANS = "'Geist Sans', 'Helvetica Neue', system-ui, sans-serif";

// Preload Google Fonts so canvas can use them
function loadGoogleFonts() {
  if (typeof document === "undefined") return Promise.resolve();
  const id = "cert-google-fonts";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Dancing+Script:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
  // Wait for fonts to be ready
  return document.fonts.ready;
}

function drawCornerOrnament(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.3, size * 0.3, size * 0.15, 0, Math.PI * 1.5, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.15, size * 0.15, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

export default function Certificate({ memberName, eventsAttended, completionDate }) {
  const canvasRef = useRef(null);
  const [advisorSigImg, setAdvisorSigImg] = useState(null);
  const [presidentSigImg, setPresidentSigImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [fontsReady, setFontsReady] = useState(false);

  // Load fonts, logo, and advisor signature
  useEffect(() => {
    loadGoogleFonts().then(() => setFontsReady(true));

    const logo = new Image();
    logo.onload = () => setLogoImg(logo);
    logo.src = "/logo.png";

    const sig = new Image();
    sig.onload = () => setAdvisorSigImg(sig);
    sig.src = "/gaskin-signature.jpg";

    const presSig = new Image();
    presSig.onload = () => setPresidentSigImg(presSig);
    presSig.src = "/webster-signature.png";
  }, []);

  const drawCertificate = useCallback(
    (canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const scale = 3; // 3x resolution for high-def output
      const W = 1200;
      const H = 850;
      canvas.width = W * scale;
      canvas.height = H * scale;
      ctx.scale(scale, scale);

      // Cream background
      ctx.fillStyle = BG_WHITE;
      ctx.fillRect(0, 0, W, H);

      const displayName = memberName || "Member Name";

      // Subtle watermark background
      ctx.save();
      ctx.globalAlpha = 0.02;
      ctx.fillStyle = BYU_BLUE;
      ctx.font = `700 26px ${SANS}`;
      ctx.textAlign = "center";
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 6);
      for (let row = -6; row <= 6; row++) {
        for (let col = -3; col <= 3; col++) {
          ctx.fillText("AI IN BUSINESS SOCIETY", col * 420, row * 60);
        }
      }
      ctx.restore();

      // Large faded logo watermark in center
      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = 0.04;
        const wmH = 280;
        const wmW = (logoImg.width / logoImg.height) * wmH;
        ctx.drawImage(logoImg, W / 2 - wmW / 2, H / 2 - wmH / 2 + 20, wmW, wmH);
        ctx.restore();
      }

      // Triple border system
      ctx.strokeStyle = BYU_BLUE;
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, W - 32, H - 32);

      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 28, W - 56, H - 56);

      ctx.strokeStyle = BYU_BLUE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(36, 36, W - 72, H - 72);

      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(42, 42, W - 84, H - 84);

      // Corner ornaments
      drawCornerOrnament(ctx, 52, 52, 50, 0);
      drawCornerOrnament(ctx, W - 52, 52, 50, Math.PI / 2);
      drawCornerOrnament(ctx, W - 52, H - 52, 50, Math.PI);
      drawCornerOrnament(ctx, 52, H - 52, 50, -Math.PI / 2);
      drawCornerOrnament(ctx, 62, 62, 28, 0);
      drawCornerOrnament(ctx, W - 62, 62, 28, Math.PI / 2);
      drawCornerOrnament(ctx, W - 62, H - 62, 28, Math.PI);
      drawCornerOrnament(ctx, 62, H - 62, 28, -Math.PI / 2);

      // Top accent lines
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 82);
      ctx.lineTo(W - 100, 82);
      ctx.stroke();
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(130, 78);
      ctx.lineTo(W - 130, 78);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(130, 86);
      ctx.lineTo(W - 130, 86);
      ctx.stroke();

      // Top diamond cluster
      ctx.fillStyle = GOLD;
      drawDiamond(ctx, W / 2, 82, 7);
      drawDiamond(ctx, W / 2 - 20, 82, 3);
      drawDiamond(ctx, W / 2 + 20, 82, 3);
      ctx.beginPath();
      ctx.arc(105, 82, 2.5, 0, Math.PI * 2);
      ctx.arc(W - 105, 82, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // University subheader - elegant spaced small caps
      ctx.fillStyle = BYU_BLUE;
      ctx.textAlign = "center";
      ctx.font = `500 11px ${SANS}`;
      ctx.fillText(
        "B R I G H A M   Y O U N G   U N I V E R S I T Y",
        W / 2,
        110
      );
      ctx.fillStyle = GOLD;
      ctx.font = `400 10px ${SANS}`;
      ctx.fillText(
        "Marriott School of Business",
        W / 2,
        125
      );

      // Decorative divider
      const divY = 184;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(260, divY);
      ctx.lineTo(W / 2 - 40, divY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W / 2 + 40, divY);
      ctx.lineTo(W - 260, divY);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      drawDiamond(ctx, W / 2, divY, 5);
      ctx.beginPath();
      ctx.arc(W / 2 - 18, divY, 1.5, 0, Math.PI * 2);
      ctx.arc(W / 2 + 18, divY, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Title - elegant serif
      ctx.fillStyle = BYU_BLUE;
      ctx.font = `700 48px ${SERIF}`;
      ctx.fillText("Certificate of AI Proficiency", W / 2, 238);

      // Gold double accent under title
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(320, 256);
      ctx.lineTo(880, 256);
      ctx.stroke();
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(360, 264);
      ctx.lineTo(840, 264);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(320, 256, 2, 0, Math.PI * 2);
      ctx.arc(880, 256, 2, 0, Math.PI * 2);
      ctx.fill();

      // "This is to certify that" - italic serif
      ctx.fillStyle = "#999999";
      ctx.font = `italic 400 19px ${SERIF}`;
      ctx.fillText("This is to certify that", W / 2, 305);

      // Member name - large elegant serif
      ctx.fillStyle = BYU_BLUE;
      ctx.font = `700 44px ${SERIF}`;
      ctx.fillText(displayName, W / 2, 360);

      // Gold line under name with end diamonds
      const nameWidth = ctx.measureText(displayName).width;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - nameWidth / 2 - 40, 376);
      ctx.lineTo(W / 2 + nameWidth / 2 + 40, 376);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      drawDiamond(ctx, W / 2 - nameWidth / 2 - 48, 376, 3);
      drawDiamond(ctx, W / 2 + nameWidth / 2 + 48, 376, 3);

      // Body text - italic serif for elegance
      ctx.fillStyle = "#555555";
      ctx.font = `italic 400 16px ${SERIF}`;
      ctx.fillText(
        "has demonstrated proficient knowledge and applied skills in artificial intelligence",
        W / 2,
        418
      );
      ctx.fillText(
        "through active participation in the AI in Business Society at Brigham Young University.",
        W / 2,
        443
      );

      // Divider before date
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 80, 472);
      ctx.lineTo(W / 2 + 80, 472);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      drawDiamond(ctx, W / 2, 472, 3);

      // Date
      const dateStr =
        completionDate ||
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      ctx.fillStyle = "#999999";
      ctx.font = `italic 400 14px ${SERIF}`;
      ctx.fillText("Awarded on", W / 2, 500);
      ctx.fillStyle = BYU_BLUE;
      ctx.font = `500 17px ${SERIF}`;
      ctx.fillText(dateStr, W / 2, 522);

      // ---- SIGNATURE SECTION ----
      const sigBaseY = 650;

      // LEFT: President signature
      const leftCenterX = 300;
      if (presidentSigImg) {
        const maxW = 320;
        const maxH = 80;
        const ratio = Math.min(maxW / presidentSigImg.width, maxH / presidentSigImg.height);
        const imgW = presidentSigImg.width * ratio;
        const imgH = presidentSigImg.height * ratio;
        const sx = leftCenterX - imgW / 2;
        const sy = sigBaseY - 10 - imgH;
        ctx.fillStyle = BG_WHITE;
        ctx.fillRect(sx, sy, imgW, imgH);
        ctx.drawImage(presidentSigImg, sx, sy, imgW, imgH);
      } else {
        ctx.save();
        ctx.fillStyle = BYU_BLUE;
        ctx.font = `32px ${SCRIPT}`;
        ctx.textAlign = "center";
        ctx.fillText("Reed Webster", leftCenterX, sigBaseY - 12);
        ctx.restore();
      }

      ctx.strokeStyle = BYU_BLUE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(160, sigBaseY);
      ctx.lineTo(440, sigBaseY);
      ctx.stroke();

      ctx.fillStyle = BYU_BLUE;
      ctx.font = `600 13px ${SANS}`;
      ctx.textAlign = "center";
      ctx.fillText("Reed Webster", leftCenterX, sigBaseY + 20);
      ctx.fillStyle = "#999999";
      ctx.font = `italic 400 11px ${SERIF}`;
      ctx.fillText("President, BYU AI in Business Society", leftCenterX, sigBaseY + 36);

      // CENTER: Gold starburst seal
      const sealX = W / 2;
      const sealY = sigBaseY - 26;
      const sealR = 42;

      ctx.save();
      ctx.shadowColor = "rgba(197, 164, 78, 0.3)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      const teeth = 36;
      for (let i = 0; i < teeth; i++) {
        const angle = (Math.PI * 2 * i) / teeth;
        const r = i % 2 === 0 ? sealR + 6 : sealR - 2;
        const px = sealX + Math.cos(angle) * r;
        const py = sealY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = BG_WHITE;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = GOLD;
      ctx.font = `600 7.5px ${SANS}`;
      const sealText = "AI IN BUSINESS SOCIETY \u2022 BYU \u2022";
      const angleStep = (Math.PI * 2) / sealText.length;
      for (let i = 0; i < sealText.length; i++) {
        ctx.save();
        ctx.translate(sealX, sealY);
        ctx.rotate(-Math.PI / 2 + angleStep * i);
        ctx.translate(0, -sealR + 16);
        ctx.textAlign = "center";
        ctx.fillText(sealText[i], 0, 0);
        ctx.restore();
      }

      ctx.fillStyle = GOLD;
      ctx.font = `700 18px ${SERIF}`;
      ctx.textAlign = "center";
      ctx.fillText("AI", sealX, sealY + 7);

      // RIGHT: Advisor signature (uploaded image or placeholder)
      const rightCenterX = 900;

      if (advisorSigImg) {
        const maxW = 320;
        const maxH = 80;
        const ratio = Math.min(maxW / advisorSigImg.width, maxH / advisorSigImg.height);
        const imgW = advisorSigImg.width * ratio;
        const imgH = advisorSigImg.height * ratio;
        const sx = rightCenterX - imgW / 2;
        const sy = sigBaseY - 10 - imgH;
        ctx.fillStyle = BG_WHITE;
        ctx.fillRect(sx, sy, imgW, imgH);
        ctx.drawImage(advisorSigImg, sx, sy, imgW, imgH);
      } else {
        ctx.fillStyle = "#cccccc";
        ctx.font = `italic 400 13px ${SERIF}`;
        ctx.textAlign = "center";
        ctx.fillText("(signature pending)", rightCenterX, sigBaseY - 16);
      }

      ctx.strokeStyle = BYU_BLUE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(760, sigBaseY);
      ctx.lineTo(1040, sigBaseY);
      ctx.stroke();

      ctx.fillStyle = BYU_BLUE;
      ctx.font = `600 13px ${SANS}`;
      ctx.textAlign = "center";
      ctx.fillText("Dr. James Gaskin", rightCenterX, sigBaseY + 20);
      ctx.fillStyle = "#999999";
      ctx.font = `italic 400 11px ${SERIF}`;
      ctx.fillText("Club Advisor, AI in Business Society", rightCenterX, sigBaseY + 36);

      // Bottom accent lines
      const btmY = H - 78;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, btmY);
      ctx.lineTo(W - 100, btmY);
      ctx.stroke();
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(130, btmY + 4);
      ctx.lineTo(W - 130, btmY + 4);
      ctx.stroke();

      ctx.fillStyle = GOLD;
      drawDiamond(ctx, W / 2, btmY, 7);
      drawDiamond(ctx, W / 2 - 20, btmY, 3);
      drawDiamond(ctx, W / 2 + 20, btmY, 3);
      ctx.beginPath();
      ctx.arc(105, btmY, 2.5, 0, Math.PI * 2);
      ctx.arc(W - 105, btmY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Bottom-left logo
      if (logoImg) {
        const logoH = 40;
        const logoW = (logoImg.width / logoImg.height) * logoH;
        ctx.drawImage(logoImg, 60, H - 75, logoW, logoH);
      }

    },
    [memberName, completionDate, advisorSigImg, presidentSigImg, logoImg, fontsReady]
  );

  // Redraw when inputs change
  useEffect(() => {
    if (canvasRef.current) drawCertificate(canvasRef.current);
  }, [drawCertificate]);

  function handleDownloadPNG() {
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

  function handleDownloadPDF() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCertificate(canvas);
    const imgData = canvas.toDataURL("image/png");
    const pdf = document.createElement("iframe");
    pdf.style.display = "none";
    document.body.appendChild(pdf);
    const doc = pdf.contentWindow.document;
    doc.open();
    doc.write(`
      <html><head><title>Certificate</title><style>
        @page { size: landscape; margin: 0; }
        body { margin: 0; }
        img { width: 100vw; height: auto; display: block; }
      </style></head><body><img src="${imgData}" /></body></html>
    `);
    doc.close();
    setTimeout(() => {
      pdf.contentWindow.print();
      setTimeout(() => document.body.removeChild(pdf), 1000);
    }, 500);
  }

  return (
    <div className="space-y-5">
      {/* Certificate Preview */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
        <canvas
          ref={(el) => {
            canvasRef.current = el;
            if (el) drawCertificate(el);
          }}
          className="w-full"
          style={{ aspectRatio: "1200/850" }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownloadPNG}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--byu-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 shadow-sm"
        >
          <FileImage size={16} />
          Download PNG
        </button>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--byu-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 shadow-sm"
        >
          <FileText size={16} />
          Download PDF
        </button>
      </div>

      {/* LinkedIn Instructions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Linkedin size={20} className="text-[#0A66C2]" />
          <h3 className="text-base font-semibold text-gray-900">Add to Your LinkedIn Profile</h3>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Scroll to the bottom of your LinkedIn profile and click <span className="font-semibold">Add License or Certification</span></li>
          <li><span className="font-semibold">Name:</span> Machine Learning Basics</li>
          <li><span className="font-semibold">Issuing Organization:</span> AI in Business Society <span className="text-gray-500">(click on the page when it pops up)</span></li>
          <li><span className="font-semibold">Issue Date:</span> 3/26/2026</li>
          <li><span className="font-semibold">Media:</span> Click &quot;Add photo&quot; and upload your downloaded certificate image</li>
        </ol>
      </div>
    </div>
  );
}
