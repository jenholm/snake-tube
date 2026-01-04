import { NextResponse } from "next/server";
import { resolveChannelId } from "@/lib/youtube";

export async function POST(request: Request) {
    const { url } = await request.json();
    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        const channelId = await resolveChannelId(url);
        console.log(`Resolved URL ${url} to ID: ${channelId}`);
        if (!channelId) {
            return NextResponse.json({ error: "Could not find a valid YouTube channel at that URL. Double check the link." }, { status: 400 });
        }

        return NextResponse.json({ channelId });
    } catch (error: any) {
        console.error("Error resolving channel:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
