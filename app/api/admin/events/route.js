import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

// GET /api/admin/events — list all events (admin)
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/events]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/admin/events — create a new event
export async function POST(req) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { title, description, event_date, location, event_type, star_value, event_password, password_generated_at, google_calendar_id } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!event_date) {
      return NextResponse.json({ error: "event_date is required" }, { status: 400 });
    }

    const starVal = parseInt(star_value, 10);
    if (isNaN(starVal) || starVal < 0) {
      return NextResponse.json({ error: "star_value must be a non-negative integer" }, { status: 400 });
    }

    // If this came from a Google Calendar event, check if it already exists
    if (google_calendar_id) {
      const { data: existing } = await supabase
        .from("events")
        .select("*")
        .eq("google_calendar_id", google_calendar_id)
        .maybeSingle();

      if (existing) {
        // Update the existing event with new password
        const { data: updated, error: updateErr } = await supabase
          .from("events")
          .update({
            event_password: event_password?.trim() || null,
            password_generated_at: password_generated_at || null,
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (updateErr) {
          console.error("[POST /api/admin/events] update existing:", updateErr);
          return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: "Event updated", data: updated });
      }
    }

    const insertData = {
      title: title.trim(),
      description: description?.trim() || null,
      event_date,
      location: location?.trim() || null,
      event_type: event_type?.trim() || "general",
      star_value: starVal,
      event_password: event_password?.trim() || null,
      password_generated_at: password_generated_at || null,
    };
    if (google_calendar_id) insertData.google_calendar_id = google_calendar_id;

    const { data, error } = await supabase
      .from("events")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      console.error("[POST /api/admin/events]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Event created", data }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/events]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// PUT /api/admin/events — update an event
export async function PUT(req) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { id, title, description, event_date, location, event_type, star_value, event_password, password_generated_at } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!event_date) {
      return NextResponse.json({ error: "event_date is required" }, { status: 400 });
    }

    const starVal = parseInt(star_value, 10);
    if (isNaN(starVal) || starVal < 0) {
      return NextResponse.json({ error: "star_value must be a non-negative integer" }, { status: 400 });
    }

    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      event_date,
      location: location?.trim() || null,
      event_type: event_type?.trim() || "general",
      star_value: starVal,
      event_password: event_password?.trim() || null,
    };
    if (password_generated_at !== undefined) {
      updateData.password_generated_at = password_generated_at;
    }

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[PUT /api/admin/events]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Event updated", data });
  } catch (e) {
    console.error("[PUT /api/admin/events]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// DELETE /api/admin/events — delete an event
export async function DELETE(req) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/events]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (e) {
    console.error("[DELETE /api/admin/events]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
