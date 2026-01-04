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
        // Build a search query for the channel's videos
        const videos = await YouTube.search(channelId, { limit: 20, type: "video" });

        return videos.map((video) => ({
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
        // If it's a full URL, we can try to find the video or channel context
        const videos = await YouTube.search(url, { limit: 1, type: "video" });
        if (videos.length > 0 && videos[0].channel) {
            return videos[0].channel.id;
        }

        // Try searching as a channel
        const channels = await YouTube.search(url, { limit: 1, type: "channel" });
        if (channels.length > 0) return channels[0].id;

        return null;
    } catch (error: any) {
        console.error(`Scraping Error [resolveChannelId] (${url}):`, error.message);
        return null;
    }
}
