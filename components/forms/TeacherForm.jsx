"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema, scaiLeadSchema } from "@/lib/validators";
import { defaultSubgroups, exampleMajors } from "@/lib/constants";

export default function TeacherForm() {
  const [submitting, setSubmitting] = useState(false);
  const [showScai, setShowScai] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      role: "teacher",
      email: "",
      mainOptIn: true,
      subgroups: [],
      major: "",
      otherMajor: "",
      scaiOptIn: false,
    },
  });

  const selectedMajor = watch("major");

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      alert("You are in. Check your inbox for a welcome note.");
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitScaiLead(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      name: form.name.value,
      email: form.scaiEmail.value,
      course: form.course.value,
      details: form.details.value,
    };
    const parsed = scaiLeadSchema.safeParse(payload);
    if (!parsed.success) {
      alert("Please fill all SCAI fields correctly.");
      return;
    }
    const res = await fetch("/api/scai-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to submit SCAI interest");
      return;
    }
    alert("Thanks! We'll reach out about Student Consultants on AI.");
    form.reset();
  }

  return (
    <div className="grid gap-10">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 max-w-xl">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("mainOptIn")} />
          <span>Add me to the main email for next events, interesting facts, and highlights.</span>
        </label>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="mt-1 w-full rounded border p-2" placeholder="you@byu.edu" {...register("email")} />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Department/Major</label>
          <select className="mt-1 w-full rounded border p-2" {...register("major")}>
            <option value="">Select...</option>
            {exampleMajors.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {selectedMajor === "Other" && (
          <div>
            <label className="block text-sm font-medium">Other Department/Major</label>
            <input className="mt-1 w-full rounded border p-2" placeholder="Type your department" {...register("otherMajor")} />
          </div>
        )}

        <fieldset>
          <legend className="text-sm font-medium">Subgroups</legend>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {defaultSubgroups.map((s) => (
              <label key={s.id} className="flex items-center gap-2">
                <input type="checkbox" value={s.id} {...register("subgroups")} />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("scaiOptIn")} />
          <span>Subscribe to Student Consultants on AI (SC AI)</span>
        </label>

        <button disabled={submitting} className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold disabled:opacity-60">
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      <div>
        <button onClick={() => setShowScai((v) => !v)} className="rounded-md border px-4 py-2">
          {showScai ? "Hide" : "Open"} SC AI panel
        </button>
        {showScai && (
          <div className="mt-4 rounded-lg border p-4">
            <h2 className="text-xl font-semibold">Student Consultants on AI (SC AI)</h2>
            <p className="mt-2 text-gray-700">Request help from student consultants for your course or project.</p>

            <form className="mt-4 grid gap-4 max-w-xl" onSubmit={submitScaiLead}>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input name="name" className="mt-1 w-full rounded border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input name="scaiEmail" type="email" className="mt-1 w-full rounded border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Course</label>
                <input name="course" className="mt-1 w-full rounded border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Brief need</label>
                <textarea name="details" rows={4} className="mt-1 w-full rounded border p-2" />
              </div>
              <button className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold">Submit interest</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


