import { google } from "googleapis";

function getYoutubeClient() {
    return google.youtube({
        version: "v3",
        auth: process.env.YOUTUBE_API_KEY,
    });
}

export interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    viewCount: number;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
}

export async function getChannelVideos(channelId: string) {
    const youtube = getYoutubeClient();
    try {
        // Get the uploads playlist ID for the channel
        const channelResponse = await youtube.channels.list({
            part: ["contentDetails"],
            id: [channelId],
        });

        const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) return [];

        const playlistResponse = await youtube.playlistItems.list({
            part: ["snippet", "contentDetails"],
            playlistId: uploadsPlaylistId,
            maxResults: 20,
        });

        const videoIds = playlistResponse.data.items?.map((item) => item.contentDetails?.videoId).filter(Boolean) as string[] || [];
        if (videoIds.length === 0) return [];

        const videoResponse = await youtube.videos.list({
            part: ["snippet", "statistics"],
            id: videoIds,
        });

        return videoResponse.data.items?.map((item) => ({
            id: item.id!,
            title: item.snippet?.title || "",
            thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
            viewCount: parseInt(item.statistics?.viewCount || "0", 10),
            publishedAt: item.snippet?.publishedAt || "",
            channelTitle: item.snippet?.channelTitle || "",
            channelId: item.snippet?.channelId || "",
        })) || [];
    } catch (error: any) {
        console.error(`YouTube API Error for channel ${channelId}:`, error?.response?.data || error.message);
        return [];
    }
}

export async function resolveChannelId(url: string) {
    const youtube = getYoutubeClient();
    try {
        // Simple regex to extract part of the URL
        const handleMatch = url.match(/@([^/?#]+)/);
        if (handleMatch) {
            const response = await youtube.search.list({
                part: ["snippet"],
                q: handleMatch[0],
                type: ["channel"],
                maxResults: 1,
            });
            return response.data.items?.[0]?.snippet?.channelId || null;
        }

        const idMatch = url.match(/channel\/([^/?#]+)/);
        if (idMatch) return idMatch[1];

        return null;
    } catch (error: any) {
        console.error(`YouTube API Error resolving ${url}:`, error?.response?.data || error.message);
        return null;
    }
}
