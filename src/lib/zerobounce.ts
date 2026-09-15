// ZeroBounce Email Validation & Deliverability Service
export interface ZeroBounceValidationResult {
  address: string;
  status: 'valid' | 'invalid' | 'catch-all' | 'unknown' | 'spamtrap' | 'abuse' | 'do_not_mail';
  sub_status: string;
  free_email: boolean;
  did_you_mean?: string;
  account: string;
  domain: string;
  domain_age_days?: string;
  smtp_provider?: string;
  mx_found: string;
  mx_record: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  country?: string;
  region?: string;
  city?: string;
  zipcode?: string;
}

export async function validateEmailWithZeroBounce(email: string, ipAddress: string = ""): Promise<ZeroBounceValidationResult | null> {
  const apiKey = process.env.ZEROBOUNCE_API_KEY || "913cc2b1160940c7b1e8ce29e4009740";
  if (!apiKey || !email) return null;

  try {
    const url = new URL("https://api.zerobounce.net/v2/validate");
    url.searchParams.append("api_key", apiKey);
    url.searchParams.append("email", email.trim().toLowerCase());
    if (ipAddress) {
      url.searchParams.append("ip_address", ipAddress);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return data as ZeroBounceValidationResult;
    }
  } catch (error: any) {
    console.warn("[ZeroBounce] Validation error:", error?.message);
  }

  return null;
}

export async function getZeroBounceCredits(): Promise<number | null> {
  const apiKey = process.env.ZEROBOUNCE_API_KEY || "913cc2b1160940c7b1e8ce29e4009740";
  if (!apiKey) return null;

  try {
    const url = `https://api.zerobounce.net/v2/getcredits?api_key=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return typeof data.Credits === 'string' ? parseInt(data.Credits, 10) : data.Credits;
    }
  } catch (e) {
    console.warn("[ZeroBounce] Credits check error:", e);
  }

  return null;
}
