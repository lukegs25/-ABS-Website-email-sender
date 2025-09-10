"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema } from "@/lib/validators";
import { defaultSubgroups, exampleMajors } from "@/lib/constants";
import { createClient } from "@/utils/supabase/client";

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
      const supabase = createClient();
      const { email, mainOptIn, subgroups, major, otherMajor, notifyNewMajorsOrSubgroups, otherAreasInterest } = values;

      if (!email) throw new Error("Email required");

      const audiences = [];
      
      // Determine user's major
      const userMajor = major === 'Other' ? otherMajor : major;
      
      // Main AI in Business newsletter
      if (mainOptIn) audiences.push(8); // ai-in-business-main
      
      // Special interest groups
      if (subgroups?.includes('scai')) audiences.push(7); // scai-students
      if (subgroups?.includes('marketing')) audiences.push(5); // marketing
      if (subgroups?.includes('finance')) audiences.push(6); // finance
      if (subgroups?.includes('semi_conductor')) audiences.push(4); // semi-conductors
      if (subgroups?.includes('accounting')) audiences.push(9); // accounting

      // Handle "other areas" interest
      if (notifyNewMajorsOrSubgroups && otherAreasInterest?.trim()) {
        audiences.push(3); // etc audience
      }

      if (audiences.length === 0) throw new Error("Please select at least one newsletter");

      // Check for existing subscriptions
      const { data: existing } = await supabase
        .from('new_subscribers')
        .select('audience_id')
        .eq('email', email)
        .in('audience_id', audiences);

      if (existing && existing.length > 0) {
        const existingAudiences = existing.map(sub => sub.audience_id);
        const newAudiences = audiences.filter(id => !existingAudiences.includes(id));
        
        if (newAudiences.length === 0) {
          alert("You're already subscribed to all selected newsletters!");
          return;
        }
        
        // Only insert new subscriptions
        const inserts = newAudiences.map(audience_id => ({
          email,
          audience_id,
          major: userMajor,
          other_text: (audience_id === 3 && otherAreasInterest?.trim()) ? otherAreasInterest.trim() : null,
          is_student: true
        }));
        const { error } = await supabase.from('new_subscribers').insert(inserts);
        
        if (error) throw new Error("Failed to subscribe");
        alert(`Added to ${newAudiences.length} new newsletter(s)! You were already subscribed to ${existingAudiences.length} of them.`);
      } else {
        // No existing subscriptions, insert all
        const inserts = audiences.map(audience_id => ({
          email,
          audience_id,
          major: userMajor,
          other_text: (audience_id === 3 && otherAreasInterest?.trim()) ? otherAreasInterest.trim() : null,
          is_student: true
        }));
        const { error } = await supabase.from('new_subscribers').insert(inserts);

        if (error) throw new Error("Failed to subscribe");
        alert("You are in. Check your inbox for a welcome note.");
      }
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


