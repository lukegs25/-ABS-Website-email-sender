"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema } from "@/lib/validators";
import { exampleMajors } from "@/lib/constants";

export default function JoinForm() {
  const [submitting, setSubmitting] = useState(false);
  const [showScai, setShowScai] = useState(false);
  const [availableSubgroups, setAvailableSubgroups] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      scaiOptIn: false,
      advisorInterest: false,
      notifyNewMajorsOrSubgroups: false,
      otherAreasInterest: "",
    },
  });

  const role = watch("role");
  const selectedMajor = watch("major");
  const wantsOtherAreas = watch("notifyNewMajorsOrSubgroups");
  const isStudent = role === "student";

  // Fetch available audiences on mount
  useEffect(() => {
    async function fetchAudiences() {
      try {
        const response = await fetch("/api/audiences");
        const data = await response.json();

        if (data.audiences) {
          const subgroups = data.audiences
            .filter((aud) => {
              const nameLower = aud.name.toLowerCase();
              if (isStudent) {
                return (
                  !nameLower.includes("ai in business") &&
                  !nameLower.includes("ai-in-business-main") &&
                  !nameLower.includes("main")
                );
              } else {
                return (
                  !nameLower.includes("ai in business") &&
                  !nameLower.includes("ai-in-business-main") &&
                  !nameLower.includes("main") &&
                  !(nameLower.includes("scai") && nameLower.includes("teacher"))
                );
              }
            })
            .map((aud) => ({
              id: aud.id.toString(),
              name: aud.name,
              audienceId: aud.id,
            }));

          setAvailableSubgroups(subgroups);
        }
      } catch (error) {
        console.error("Error fetching audiences:", error);
        setAvailableSubgroups([]);
      }
    }

    fetchAudiences();
  }, [isStudent]);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const {
        email,
        mainOptIn,
        scaiOptIn,
        subgroups,
        advisorInterest,
        major,
        otherMajor,
        notifyNewMajorsOrSubgroups,
        otherAreasInterest,
        role: userRole,
      } = values;

      if (!email) throw new Error("Email required");

      const audiences = [];

      const userMajor = major === "Other" ? otherMajor : major;

      const response = await fetch("/api/audiences");
      const data = await response.json();
      const allAudiences = data.audiences || [];

      const findAudienceId = (namePattern) => {
        const aud = allAudiences.find((a) =>
          a.name.toLowerCase().includes(namePattern.toLowerCase())
        );
        return aud?.id;
      };

      if (mainOptIn) {
        const mainId =
          findAudienceId("ai in business") || findAudienceId("main");
        if (mainId) audiences.push(mainId);
      }

      if (!isStudent && scaiOptIn) {
        const scaiTeacherId =
          findAudienceId("scai") &&
          allAudiences.find(
            (a) =>
              a.name.toLowerCase().includes("scai") &&
              a.name.toLowerCase().includes("teacher")
          )?.id;
        if (scaiTeacherId) audiences.push(scaiTeacherId);
      }

      if (!isStudent && advisorInterest) {
        const advisorId = allAudiences.find((a) => {
          const nameLower = a.name.toLowerCase();
          return (
            (nameLower.includes("teacher") && nameLower.includes("support")) ||
            nameLower.includes("advisor")
          );
        })?.id;
        if (advisorId) audiences.push(advisorId);
      }

      if (subgroups && subgroups.length > 0) {
        subgroups.forEach((subgroupId) => {
          const subgroup = availableSubgroups.find(
            (sg) => sg.id === subgroupId
          );
          if (subgroup && subgroup.audienceId) {
            audiences.push(subgroup.audienceId);
          }
        });
      }

      if (notifyNewMajorsOrSubgroups && otherAreasInterest?.trim()) {
        const etcId =
          findAudienceId("etc") ||
          findAudienceId("general") ||
          findAudienceId("other");
        if (etcId) audiences.push(etcId);
      }

      if (audiences.length === 0)
        throw new Error("Please select at least one newsletter");

      const subscriptions = audiences.map((audience_id) => ({
        email,
        audience_id,
        major: userMajor,
        other_text:
          audience_id === 3 && otherAreasInterest?.trim()
            ? otherAreasInterest.trim()
            : null,
        is_student: isStudent,
      }));

      const subscriptionResponse = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subscriptions }),
      });

      const result = await subscriptionResponse.json();

      if (!subscriptionResponse.ok) {
        throw new Error(result.error || "Failed to subscribe");
      }

      if (result.existingCount > 0 && result.newCount > 0) {
        alert(
          `Added to ${result.newCount} new newsletter(s)! You were already subscribed to ${result.existingCount} of them.`
        );
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-6 max-w-xl">
      {/* Role toggle */}
      <div>
        <label className="block text-sm font-medium mb-2">I am a...</label>
        <div className="flex rounded-md border border-[color:var(--byu-blue)] overflow-hidden">
          <button
            type="button"
            onClick={() => setValue("role", "student")}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              isStudent
                ? "bg-[color:var(--byu-blue)] text-white"
                : "bg-white text-[color:var(--byu-blue)] hover:bg-blue-50"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setValue("role", "teacher")}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              !isStudent
                ? "bg-[color:var(--byu-blue)] text-white"
                : "bg-white text-[color:var(--byu-blue)] hover:bg-blue-50"
            }`}
          >
            Faculty
          </button>
        </div>
        <input type="hidden" {...register("role")} />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          className="mt-1 w-full rounded border p-2"
          placeholder="you@byu.edu"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Major / Department */}
      <div>
        <label className="block text-sm font-medium">
          {isStudent ? "Major" : "Department"}
        </label>
        <select
          className="mt-1 w-full rounded border p-2"
          {...register("major")}
        >
          <option value="">Select...</option>
          {exampleMajors.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {selectedMajor === "Other" && (
        <div>
          <label className="block text-sm font-medium">
            {isStudent ? "Other Major" : "Other Department"}
          </label>
          <input
            className="mt-1 w-full rounded border p-2"
            placeholder={isStudent ? "Type your major" : "Type your department"}
            {...register("otherMajor")}
          />
        </div>
      )}

      {/* Faculty-only fields */}
      {!isStudent && (
        <>
          <div className="rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3 transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-6 w-6 accent-[color:var(--byu-blue)]"
                  {...register("scaiOptIn")}
                />
                <span className="text-xl font-semibold text-[color:var(--byu-blue)]">
                  I want to sign up for the Students Consulting on AI (SCAI) program
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowScai((v) => !v)}
                className="rounded-md border px-3 py-1 text-sm text-[color:var(--byu-blue)] border-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10"
              >
                {showScai ? "Hide details" : "Details"}
              </button>
            </div>
            {showScai && (
              <div className="mt-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/30 p-3 text-sm text-[color:var(--byu-blue)]">
                <p className="font-semibold">The SCAI Program:</p>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-semibold">AI Curriculum Integration:</span>{" "}
                    Personalized guidance on embedding AI concepts and tools directly into your class content.
                  </li>
                  <li>
                    <span className="font-semibold">Personal Student Consulting:</span>{" "}
                    One-on-one support to help you and your students leverage AI, making coursework more dynamic and relevant.
                  </li>
                  <li>
                    <span className="font-semibold">Tool Walkthroughs:</span>{" "}
                    Stay ahead with hands-on training in the latest AI technologies, tailored to your academic goals.
                  </li>
                  <li>
                    <span className="font-semibold">Empower &amp; Raise the Bar:</span>{" "}
                    Students are eager to learn faster and better. Learn what it means to help students ethically produce and become with AI.
                  </li>
                </ul>
                <p className="mt-3 font-semibold">
                  Be a part of the community launching education into the future!
                </p>
                <p className="mt-1 font-semibold">
                  Learn what SCAI can do for your classroom!
                </p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3 transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
            <input
              type="checkbox"
              className="h-6 w-6 accent-[color:var(--byu-blue)]"
              {...register("advisorInterest")}
            />
            <span className="text-xl font-semibold text-[color:var(--byu-blue)]">
              I would be interested in supporting and/or helping advise a student group centered on AI in my department/major
            </span>
          </label>
        </>
      )}

      {/* Main newsletter opt-in */}
      <label className="flex items-center gap-3 rounded-md border-2 border-[color:var(--byu-blue)] bg-blue-50/20 p-3 transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
        <input
          type="checkbox"
          className="h-6 w-6 accent-[color:var(--byu-blue)]"
          {...register("mainOptIn")}
        />
        <span className="text-xl font-semibold text-[color:var(--byu-blue)]">
          Subscribe to the AI in Business Society email: upcoming events, AI news, and more
        </span>
      </label>

      {/* Group interest checkboxes */}
      <fieldset>
        <legend className="text-sm font-medium">
          {isStudent
            ? "I am interested in student groups focused on AI in these topics:"
            : "I want to hear about groups focused on AI in these areas:"}
        </legend>
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
          <label className="block text-sm font-medium">
            Add an area you&apos;re interested in
          </label>
          <input
            className="mt-1 w-full rounded border p-2"
            placeholder="e.g., ai in healthcare, ai in law, ai in music"
            {...register("otherAreasInterest")}
          />
        </div>
      )}

      <button
        disabled={submitting}
        className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>

      <div className="text-sm sm:text-base">
        <a
          href="https://calendar.google.com/calendar/embed?src=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef%40group.calendar.google.com&ctz=America%2FDenver"
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--byu-blue)] underline"
        >
          Don&apos;t forget to join our Google Calendar
        </a>
      </div>
    </form>
  );
}
