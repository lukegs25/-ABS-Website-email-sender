"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobPostingSchema } from "@/lib/validators";

const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

export default function PostJobPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState("");
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: { job_type: "full-time" },
  });

  function handleLogoChange(file) {
    setLogoError("");
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setLogoError("Only image files are allowed (JPEG, PNG, WebP, GIF, SVG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Image must be under 2 MB");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleFileInput(e) {
    handleLogoChange(e.target.files?.[0] ?? null);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleLogoChange(e.dataTransfer.files?.[0] ?? null);
  }

  function removeLogo() {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setLogoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      let logo_url = undefined;

      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const uploadRes = await fetch("/api/jobs/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
        logo_url = uploadData.url;
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, logo_url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitted(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-6 p-8 max-w-2xl">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <svg className="mx-auto mb-3 h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-green-800">Job Submitted!</h2>
          <p className="mt-2 text-green-700">
            Your job posting is under review. Once approved by an admin it will appear on the board.
          </p>
          <a
            href="/jobs"
            className="mt-4 inline-block rounded-md bg-[color:var(--byu-blue)] px-6 py-2 text-white font-semibold hover:opacity-90"
          >
            Back to Job Board
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">Post a Job</h1>
        <p className="mt-2 text-gray-600">
          Submit an AI-related job opening. Postings are reviewed before appearing on the board.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            className="mt-1 w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="e.g. AI Product Manager"
            {...register("title")}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company <span className="text-red-500">*</span>
          </label>
          <input
            className="mt-1 w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="e.g. Acme Corp"
            {...register("company")}
          />
          {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>}
        </div>

        {/* Company Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Logo / Job Photo</label>
          {!logoPreview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-[color:var(--byu-blue)] transition-colors"
            >
              <svg className="mx-auto mb-2 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600">Drag and drop or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF, SVG — max 2 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-4">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-20 w-20 rounded-md border object-contain p-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{logoFile?.name}</p>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="mt-1 text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          {logoError && <p className="mt-1 text-sm text-red-600">{logoError}</p>}
        </div>

        {/* Apply URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Application URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            className="mt-1 w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="https://yourcompany.com/careers/..."
            {...register("url")}
          />
          {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>}
        </div>

        {/* Location + Job Type */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              className="mt-1 w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              placeholder="e.g. Remote, Provo UT"
              {...register("location")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Type</label>
            <select
              className="mt-1 w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              {...register("job_type")}
            >
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={6}
            className="mt-1 w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="Describe the role, responsibilities, and qualifications..."
            {...register("description")}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className="mt-1 w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="hiring@yourcompany.com"
            {...register("contact_email")}
          />
          {errors.contact_email && <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>}
        </div>

        <p className="text-xs text-gray-500">
          Fields marked <span className="text-red-500">*</span> are required.
          Submissions are reviewed before going live.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Job Posting"}
        </button>
      </form>
    </div>
  );
}
