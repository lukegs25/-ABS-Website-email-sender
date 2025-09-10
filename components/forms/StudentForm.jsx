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

      <button disabled={submitting} className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}


