import YouTube from "youtube-sr";

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
    try {
        // Search for the channel ID as a query
        const videos = await YouTube.search(channelId, { limit: 20, type: "video" });

        // IMPORTANT: Strictly filter to ONLY include videos from THIS channel ID.
        // YouTube.search is a keyword search, so it returns "related" videos.
        // We must filter them out so removal actually works as expected.
        return videos
            .filter((video) => video.channel?.id === channelId)
            .map((video) => ({
                id: video.id!,
                title: video.title || "",
                thumbnail: video.thumbnail?.url || "",
                viewCount: video.views || 0,
                publishedAt: video.uploadedAt || "",
                channelTitle: video.channel?.name || "",
                channelId: video.channel?.id || channelId,
            }));
    } catch (error: any) {
        console.error(`Scraping Error [getChannelVideos] (${channelId}):`, error.message);
        return [];
    }
}

export async function resolveChannelId(url: string) {
    try {
        // 1. Try search by full URL
        const videos = await YouTube.search(url, { limit: 1, type: "video" });
        if (videos.length > 0 && videos[0].channel) {
            return {
                id: videos[0].channel.id!,
                name: videos[0].channel.name || "Unknown Channel"
            };
        }

        // 2. Try search as a channel
        const channels = await YouTube.search(url, { limit: 1, type: "channel" });
        if (channels.length > 0) {
            return {
                id: channels[0].id!,
                name: channels[0].name || "Unknown Channel"
            };
        }

        return null;
    } catch (error: any) {
        console.error(`Scraping Error [resolveChannelId] (${url}):`, error.message);
        return null;
    }
}
