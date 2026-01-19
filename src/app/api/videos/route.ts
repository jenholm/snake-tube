import { NextResponse } from "next/server";
import { getChannelVideos } from "@/lib/youtube";
import { getChannels } from "@/lib/db";
import { scoreVideosWithAI } from "@/lib/ai";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
    noStore();
    const channelEntries = getChannels();

    if (channelEntries.length === 0) {
        return NextResponse.json([]);
    }

    try {
        // Fetch videos from all channels in parallel
        const videoPromises = channelEntries.map((c) =>
            getChannelVideos(c.id, c.name)
        );

        const videoResults = await Promise.all(videoPromises);
        let allVideos = videoResults.flat();

        // Integrate AI Personalization
        console.log(`[API] Scoring ${allVideos.length} videos with AI...`);
        const personalizedVideos = await scoreVideosWithAI(allVideos);

        // Limit to 200
        const limitedVideos = personalizedVideos.slice(0, 200);

        return NextResponse.json(limitedVideos);
    } catch (error: any) {
        console.error("Error fetching videos:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
