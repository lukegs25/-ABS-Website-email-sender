"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema } from "@/lib/validators";
import { exampleMajors } from "@/lib/constants";
import { createClient } from "@/utils/supabase/client";

export default function StudentForm() {
  const [submitting, setSubmitting] = useState(false);
  const [availableSubgroups, setAvailableSubgroups] = useState([]);
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

  // Fetch available audiences on mount
  useEffect(() => {
    async function fetchAudiences() {
      try {
        const response = await fetch('/api/audiences');
        const data = await response.json();
        
        if (data.audiences) {
          // Map all audiences to subgroups for student form
          // Exclude the main "ai-in-business-main" audience since it's shown separately
          const subgroups = data.audiences
            .filter(aud => {
              const nameLower = aud.name.toLowerCase();
              // Exclude main audience (shown as separate checkbox)
              return !nameLower.includes('ai in business') && 
                     !nameLower.includes('ai-in-business-main') &&
                     !nameLower.includes('main');
            })
            .map(aud => ({
              id: aud.id.toString(),
              name: aud.name,
              audienceId: aud.id
            }));
          
          setAvailableSubgroups(subgroups);
        }
      } catch (error) {
        console.error('Error fetching audiences:', error);
        // Fallback to empty array if fetch fails
        setAvailableSubgroups([]);
      }
    }
    
    fetchAudiences();
  }, []);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { email, mainOptIn, subgroups, major, otherMajor, notifyNewMajorsOrSubgroups, otherAreasInterest } = values;

      if (!email) throw new Error("Email required");

      const audiences = [];
      
      // Determine user's major
      const userMajor = major === 'Other' ? otherMajor : major;
      
      // Fetch all audiences to get IDs dynamically
      const response = await fetch('/api/audiences');
      const data = await response.json();
      const allAudiences = data.audiences || [];
      
      // Helper to find audience ID by name pattern
      const findAudienceId = (namePattern) => {
        const aud = allAudiences.find(a => 
          a.name.toLowerCase().includes(namePattern.toLowerCase())
        );
        return aud?.id;
      };
      
      // Main AI in Business newsletter
      if (mainOptIn) {
        const mainId = findAudienceId('ai in business') || findAudienceId('main');
        if (mainId) audiences.push(mainId);
      }
      
      // Special interest groups - map selected subgroups to audience IDs
      if (subgroups && subgroups.length > 0) {
        subgroups.forEach(subgroupId => {
          const subgroup = availableSubgroups.find(sg => sg.id === subgroupId);
          if (subgroup && subgroup.audienceId) {
            audiences.push(subgroup.audienceId);
          }
        });
      }

      // Handle "other areas" interest
      if (notifyNewMajorsOrSubgroups && otherAreasInterest?.trim()) {
        const etcId = findAudienceId('etc') || findAudienceId('general') || findAudienceId('other');
        if (etcId) audiences.push(etcId);
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
        alert("You are in. Expect to hear from us soon!");
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
          {availableSubgroups.length > 0 ? (
            availableSubgroups.map((s) => (
              <label key={s.id} className="flex items-center gap-2">
                <input type="checkbox" value={s.id} {...register("subgroups")} />
                <span>{s.name}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500">Loading available groups...</p>
          )}
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
          href="https://calendar.google.com/calendar/embed?src=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef%40group.calendar.google.com&ctz=America%2FDenver"
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


