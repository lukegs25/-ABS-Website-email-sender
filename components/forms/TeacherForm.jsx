"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema, scaiLeadSchema } from "@/lib/validators";
import { exampleMajors } from "@/lib/constants";

export default function TeacherForm() {
  const [submitting, setSubmitting] = useState(false);
  const [showScai, setShowScai] = useState(false);
  const [availableSubgroups, setAvailableSubgroups] = useState([]);

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
      advisorInterest: false,
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
          // Map all audiences to subgroups for teacher form
          // Exclude main audience and SCAI (shown as separate checkboxes)
          const subgroups = data.audiences
            .filter(aud => {
              const nameLower = aud.name.toLowerCase();
              // Exclude main audience and SCAI teacher audience (shown as separate checkboxes)
              return !nameLower.includes('ai in business') && 
                     !nameLower.includes('ai-in-business-main') &&
                     !nameLower.includes('main') &&
                     !(nameLower.includes('scai') && nameLower.includes('teacher'));
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
        setAvailableSubgroups([]);
      }
    }
    
    fetchAudiences();
  }, []);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const { email, mainOptIn, scaiOptIn, subgroups, advisorInterest, major, otherMajor, notifyNewMajorsOrSubgroups, otherAreasInterest } = values;

      if (!email) throw new Error("Email required");

      const audiences = [];
      
      // Determine user's major/department
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
      
      // SCAI program for teachers
      if (scaiOptIn) {
        const scaiTeacherId = findAudienceId('scai') && allAudiences.find(a => 
          a.name.toLowerCase().includes('scai') && a.name.toLowerCase().includes('teacher')
        )?.id;
        if (scaiTeacherId) audiences.push(scaiTeacherId);
      }
      
      // Teachers supporting student groups
      if (advisorInterest) {
        const advisorId = allAudiences.find(a => {
          const nameLower = a.name.toLowerCase();
          return (nameLower.includes('teacher') && nameLower.includes('support')) || 
                 (nameLower.includes('advisor'));
        })?.id;
        if (advisorId) audiences.push(advisorId);
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

      // Prepare subscription data
      const subscriptions = audiences.map(audience_id => ({
          email,
          audience_id,
          major: userMajor,
          other_text: (audience_id === 3 && otherAreasInterest?.trim()) ? otherAreasInterest.trim() : null,
          is_student: false
        }));

      // Call API to create subscriptions (will handle notifications)
      const subscriptionResponse = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subscriptions })
      });

      const result = await subscriptionResponse.json();
        
      if (!subscriptionResponse.ok) {
        throw new Error(result.error || "Failed to subscribe");
      }

      // Show appropriate success message
      if (result.existingCount > 0 && result.newCount > 0) {
        alert(`Added to ${result.newCount} new newsletter(s)! You were already subscribed to ${result.existingCount} of them.`);
      } else if (result.newCount === 0) {
        alert("You're already subscribed to all selected newsletters!");
      } else {
        alert("You are in. Expect to hear from us soon!");
      }
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
    alert("Thanks! We'll reach out about Students Consultanting teachers on AI.");
    form.reset();
  }

  return (
    <div className="grid gap-10">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 max-w-xl">
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

        <label className="flex items-center gap-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3 transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
          <input type="checkbox" className="h-6 w-6 accent-[color:var(--byu-blue)]" {...register("mainOptIn")} />
          <span className="text-xl font-semibold text-[color:var(--byu-blue)]">AI in Business Society Email: upcoming events, AI News, and more</span>
        </label>

        <div className="rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3 transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-6 w-6 accent-[color:var(--byu-blue)]" {...register("scaiOptIn")} />
              <span className="text-xl font-semibold text-[color:var(--byu-blue)]">I want to sign up for the Students Consulting on AI (SCAI) program</span>
            </label>
            <button type="button" onClick={() => setShowScai((v) => !v)} className="rounded-md border px-3 py-1 text-sm text-[color:var(--byu-blue)] border-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10">
              {showScai ? "Hide details" : "Details"}
            </button>
          </div>
          {showScai && (
            <div className="mt-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/30 p-3 text-sm text-[color:var(--byu-blue)]">
              <p className="font-semibold">The SCAI Program:</p>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li><span className="font-semibold">AI Curriculum Integration:</span> Personalized guidance on embedding AI concepts and tools directly into your class content.</li>
                <li><span className="font-semibold">Personal Student Consulting:</span> One-on-one support to help you and your students leverage AI, making coursework more dynamic and relevant.</li>
                <li><span className="font-semibold">Tool Walkthroughs:</span> Stay ahead with hands-on training in the latest AI technologies, tailored to your academic goals.</li>
                <li><span className="font-semibold">Empower & Raise the Bar:</span> Students are eager to learn faster and better. Learn what it means to help students ethically produce and become with AI.</li>
              </ul>
              <p className="mt-3 font-semibold">Be a part of the community launching education into the future!</p>
              <p className="mt-1 font-semibold">Learn what SCAI can do for your classroom!</p>
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3 transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
          <input type="checkbox" className="h-6 w-6 accent-[color:var(--byu-blue)]" {...register("advisorInterest")} />
          <span className="text-xl font-semibold text-[color:var(--byu-blue)]">I would be interested in supporting and/or helping advise a student group centered on AI in my department/major</span>
        </label>

        <fieldset>
          <legend className="text-sm font-medium">I want to hear about groups focused on AI in these areas:</legend>
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

        <label className="mt-2 flex items-center gap-2">
          <input type="checkbox" {...register("notifyNewMajorsOrSubgroups")} />
          <span>I want to be updated about new groups and AI in other areas as well</span>
        </label>

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

        {wantsOtherAreas && (
          <div>
            <label className="block text-sm font-medium">Add an area you’re interested in</label>
            <input className="mt-1 w-full rounded border p-2" placeholder="e.g., ai in healthcare, ai in law, ai in music" {...register("otherAreasInterest")} />
          </div>
        )}
      </form>
      
    </div>
  );
}


