"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { postJobSchema } from "@/lib/validators";
import Link from "next/link";

const IMAGE_TYPES = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] };

export default function PostJobForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: "",
      company: "",
      url: "",
      description: "",
    },
  });

  const extractFromImage = useCallback(
    async (file) => {
      setExtracting(true);
      setExtractProgress("Reading image…");
      try {
        const Tesseract = (await import("tesseract.js")).default;
        setExtractProgress("Extracting text…");
        const {
          data: { text },
        } = await Tesseract.recognize(file, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") setExtractProgress(`Recognizing… ${Math.round(m.progress * 100)}%`);
          },
        });
        const rawText = (text || "").trim();
        if (!rawText) {
          alert("No text found in the image. Try a clearer photo.");
          return;
        }
        setExtractProgress("Parsing job details…");
        const parseRes = await fetch("/api/jobs/parse-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawText }),
        });
        const parsed = await parseRes.json();
        if (!parseRes.ok) {
          setValue("description", rawText);
          alert(parsed.error || "Could not parse. Description filled with extracted text—please fill in other fields.");
          return;
        }
        if (parsed.title) setValue("title", parsed.title);
        if (parsed.company) setValue("company", parsed.company);
        if (parsed.description) setValue("description", parsed.description);
        if (parsed.url) setValue("url", parsed.url);
      } catch (e) {
        console.error(e);
        alert(e.message || "Failed to extract text from image");
      } finally {
        setExtracting(false);
        setExtractProgress("");
      }
    },
    [setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: IMAGE_TYPES,
    maxFiles: 1,
    multiple: false,
    disabled: extracting,
    onDrop: (accepted) => {
      if (accepted[0]) extractFromImage(accepted[0]);
    },
  });

  async function onSubmit(values) {
    setSubmitting(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post job");
      }

      setSuccess(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-green-800">Job posted successfully</h2>
        <p className="mt-2 text-green-700">
          Your job is now live on the Job Board.
        </p>
        <Link
          href="/jobs"
          className="mt-4 inline-block rounded-md bg-[color:var(--byu-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          View Job Board
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 grid max-w-2xl gap-6"
    >
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-[color:var(--byu-blue)] bg-[color:var(--byu-blue)]/5"
            : "border-gray-300 hover:border-[color:var(--byu-blue)] hover:bg-gray-50"
        } ${extracting ? "pointer-events-none opacity-70" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {extracting ? (
            <p className="text-sm text-gray-600">{extractProgress}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive
                  ? "Drop photo here"
                  : "Drag & drop a photo of a job description"}
              </p>
              <p className="text-xs text-gray-500">
                or click to browse. JPEG, PNG, WebP.
              </p>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Job title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-gray-300 p-2.5 focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          placeholder="e.g. AI Strategy Intern"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Company name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-gray-300 p-2.5 focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          placeholder="e.g. Peterson Search Partners"
          {...register("company")}
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Application link or email <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-gray-300 p-2.5 focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          placeholder="https://apply.example.com or mailto:hr@company.com"
          {...register("url")}
        />
        <p className="mt-1 text-xs text-gray-500">
          Use a full URL (https://...) or an email address (e.g. hr@company.com)
          for resume submissions.
        </p>
        {errors.url && (
          <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Job description (optional)
        </label>
        <textarea
          rows={6}
          className="mt-1 w-full rounded-md border border-gray-300 p-2.5 focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          placeholder="Responsibilities, qualifications, deadline, etc."
          {...register("description")}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post Job"}
        </button>
        <Link
          href="/jobs"
          className="rounded-md border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
