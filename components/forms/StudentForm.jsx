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

      <label className="flex items-center gap-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3">
        <input type="checkbox" className="h-6 w-6 accent-[color:var(--byu-blue)]" {...register("mainOptIn")} />
        <span className="text-xl font-semibold text-[color:var(--byu-blue)]">Add me to the main email for the AI in Business Society, upcoming events, AI News, and more.</span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">hear about events in these areas:</legend>
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
        <input type="checkbox" {...register("notifyNewMajorsOrSubgroups")} />
        <span>I want to be notified when my major is represented as a subgroup and/or new subgroups are made.</span>
      </label>

      <button disabled={submitting} className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}


