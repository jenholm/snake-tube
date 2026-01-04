import { NextResponse } from "next/server";
import { getChannelVideos, VideoItem } from "@/lib/youtube";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const manualChannels = searchParams.get("channels")?.split(",").filter(Boolean) || [];

    if (manualChannels.length === 0) {
        return NextResponse.json([]);
    }

    try {
        // Fetch videos from all channels in parallel
        const videoPromises = manualChannels.map((id) =>
            getChannelVideos(id)
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
