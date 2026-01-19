import { NextResponse } from "next/server";
import { getPreferences, savePreferences } from "@/lib/storage";

export async function GET() {
    return NextResponse.json(getPreferences());
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const prefs = getPreferences();

        if (body.interestModel) {
            prefs.interestModel = body.interestModel;
        }

        savePreferences(prefs);
        return NextResponse.json(prefs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
