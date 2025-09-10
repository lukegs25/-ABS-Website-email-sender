"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema } from "@/lib/validators";
import { defaultSubgroups, exampleMajors } from "@/lib/constants";

export default function StudentForm() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      role: "student",
      email: "",
      mainOptIn: true,
      subgroups: [],
      major: "",
      otherMajor: "",
      notifyNewMajorsOrSubgroups: false,
      otherAreasInterest: "",
    },
  });

  const selectedMajor = watch("major");
  const wantsOtherAreas = watch("notifyNewMajorsOrSubgroups");

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-6 max-w-xl">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input type="email" className="mt-1 w-full rounded border p-2" placeholder="you@byu.edu" {...register("email")} />
        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Major</label>
        <select className="mt-1 w-full rounded border p-2" {...register("major")}>
          <option value="">Select...</option>
          {exampleMajors.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {selectedMajor === "Other" && (
        <div>
          <label className="block text-sm font-medium">Other Major</label>
          <input className="mt-1 w-full rounded border p-2" placeholder="Type your major" {...register("otherMajor")} />
        </div>
      )}

      <label className="flex items-center gap-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3 transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
        <input type="checkbox" className="h-6 w-6 accent-[color:var(--byu-blue)]" {...register("mainOptIn")} />
        <span className="text-xl font-semibold text-[color:var(--byu-blue)]">AI in Business Society Email: upcoming events, AI News, and more</span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">I am interested in student groups focused on AI in these topics:</legend>
        <div className="mt-2 grid grid-cols-1 gap-1">
          {defaultSubgroups.map((s) => (
            <label key={s.id} className="flex items-center gap-2">
              <input type="checkbox" value={s.id} {...register("subgroups")} />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2">
        <input type="checkbox" {...register("notifyNewMajorsOrSubgroups")} />
        <span>I want to be updated about new groups and AI in other areas as well</span>
      </label>

      {wantsOtherAreas && (
        <div>
          <label className="block text-sm font-medium">Add an area you’re interested in</label>
          <input className="mt-1 w-full rounded border p-2" placeholder="e.g., ai in healthcare, ai in law, ai in music" {...register("otherAreasInterest")} />
        </div>
      )}

      <button disabled={submitting} className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit"}
      </button>

      <div className="text-sm sm:text-base">
        <a
          href="https://calendar.google.com/calendar/u/0?cid=YzI0MDEyM2MzZmFhNTY0NjU3Nzc1OTUwOGI0NGFkZTI4ZmMwODU2NDg2ZmE4OWNlOTFhN2U2OTgyNDIxNGFlZkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t"
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--byu-blue)] underline"
        >
          Don't forget to join our Google Calendar
        </a>
      </div>
    </form>
  );
}


