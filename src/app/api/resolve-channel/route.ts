import { NextResponse } from "next/server";
import { resolveChannelId } from "@/lib/youtube";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    noStore();
    const { url } = await request.json();

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        const resolved = await resolveChannelId(url);
        console.log(`Resolved URL ${url} to:`, resolved);

        if (!resolved) {
            return NextResponse.json({ error: "Could not find a valid YouTube channel at that URL. Double check the link." }, { status: 400 });
        }

        return NextResponse.json({
            channelId: resolved.id,
            channelName: resolved.name
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
