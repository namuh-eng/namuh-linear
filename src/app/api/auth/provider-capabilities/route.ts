import { isGoogleOAuthConfigured } from "@/lib/auth-providers";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      providers: {
        google: isGoogleOAuthConfigured(),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
