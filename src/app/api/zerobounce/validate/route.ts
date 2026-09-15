import { NextResponse } from "next/server";
import { validateEmailWithZeroBounce, getZeroBounceCredits } from "@/lib/zerobounce";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await validateEmailWithZeroBounce(cleanEmail);

    if (!result) {
      return NextResponse.json({
        valid: true,
        status: "unknown",
        message: "Não foi possível validar no momento"
      });
    }

    const isValid = result.status === 'valid';
    const isRisky = result.status === 'catch-all' || result.status === 'unknown';
    const isInvalid = result.status === 'invalid' || result.status === 'spamtrap' || result.status === 'abuse' || result.status === 'do_not_mail';

    return NextResponse.json({
      address: result.address,
      status: result.status,
      subStatus: result.sub_status,
      isValid,
      isRisky,
      isInvalid,
      didYouMean: result.did_you_mean,
      freeEmail: result.free_email,
      mxFound: result.mx_found === 'true',
      smtpProvider: result.smtp_provider
    });
  } catch (error: any) {
    console.error("ZeroBounce API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const credits = await getZeroBounceCredits();
    return NextResponse.json({ credits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
