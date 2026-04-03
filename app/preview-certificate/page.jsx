"use client";

import Certificate from "@/components/Certificate";

export default function PreviewCertificate() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Certificate Preview</h1>
      <div className="max-w-4xl mx-auto">
        <Certificate
          memberName="John Smith"
          eventsAttended={3}
          completionDate="April 1, 2026"
        />
      </div>
    </div>
  );
}
