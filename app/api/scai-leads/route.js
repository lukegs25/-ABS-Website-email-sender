import { NextResponse } from "next/server";
import { scaiLeadSchema } from "@/lib/validators";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = scaiLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, simulated: true });
    }

    const { data: inserted, error } = await supabase
      .from("scai_leads")
      .insert({
        name: data.name,
        email: data.email,
        course: data.course,
        details: data.details,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, lead: inserted });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


