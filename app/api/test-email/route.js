import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";

export async function POST() {
  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json({ ok: true, simulated: true });
  }
  try {
    const { data, error } = await resend.emails.send({
      from: "ABS Club <no-reply@abs.example>",
      to: [process.env.TEST_EMAIL || "test@example.com"],
      subject: "ABS test email",
      html: "<p>This is a test email from ABS app.</p>",
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


