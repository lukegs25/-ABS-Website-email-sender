import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";

export async function POST(request) {
  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json({ ok: true, simulated: true });
  }
  
  try {
    const body = await request.json();
    const { email } = body;
    const testEmail = email || process.env.TEST_EMAIL || "test@example.com";
    
    const { data, error } = await resend.emails.send({
      from: "ABS Club <no-reply@aiinbusinesssociety.org>",
      to: [testEmail],
      subject: "ABS test email",
      html: "<p>This is a test email from the ABS admin system. Email functionality is working correctly!</p>",
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


