import { NextResponse } from "next/server";
import { subscriberSchema } from "@/lib/validators";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = subscriberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const atLeastOneList = data.mainOptIn || (data.subgroups && data.subgroups.length > 0) || data.scaiOptIn;
    if (!atLeastOneList) {
      return NextResponse.json({ error: "Select at least one list (Main or a Subgroup)." }, { status: 400 });
    }

    const effectiveMajor = data.otherMajor && data.otherMajor.trim().length > 0 ? data.otherMajor.trim() : (data.major || null);
    const updateMajorFlag = Boolean(data.otherMajor && data.otherMajor.trim().length > 0);

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, simulated: true });
    }

    const { data: upserted, error } = await supabase
      .from("subscribers")
      .upsert({
        email: data.email,
        role: data.role,
        major: effectiveMajor,
        update_major: updateMajorFlag,
        main_opt_in: data.mainOptIn,
        subgroups: data.subgroups,
        scai_opt_in: Boolean(data.scaiOptIn),
        notify_new: Boolean(data.notifyNewMajorsOrSubgroups),
      }, { onConflict: "email" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, subscriber: upserted });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


