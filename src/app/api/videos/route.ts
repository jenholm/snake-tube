import { NextResponse } from "next/server";
import { getChannelVideos, VideoItem } from "@/lib/youtube";
import { getChannels } from "@/lib/db";
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
        let allVideos: VideoItem[] = videoResults.flat();

        // Sort by viewCount descending
        allVideos.sort((a, b) => b.viewCount - a.viewCount);

        // Limit to 200
        const limitedVideos = allVideos.slice(0, 200);

        return NextResponse.json(limitedVideos);
    } catch (error: any) {
        console.error("Error fetching videos:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
