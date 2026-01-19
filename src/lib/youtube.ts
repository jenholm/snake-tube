import YouTube from "youtube-sr";
import { YoutubeTranscript } from 'youtube-transcript';
import { VideoItem } from "./types";

export async function getChannelVideos(channelId: string, channelName?: string): Promise<VideoItem[]> {
    try {
        const query = channelName || channelId;
        const videos = await YouTube.search(query, { limit: 10, type: "video" });

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
                description: video.description || "",
                tags: [] // youtube-sr might not provide tags in search results, need details
            }));
    } catch (error: any) {
        console.error(`Scraping Error [getChannelVideos] (${channelId}):`, error.message);
        return [];
    }
}

export async function fetchVideoDetails(videoId: string): Promise<Partial<VideoItem>> {
    try {
        const video = await YouTube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);
        return {
            description: video.description || "",
            tags: video.tags || []
        };
    } catch (error: any) {
        console.error(`Error fetching video details (${videoId}):`, error.message);
        return {};
    }
}

export async function fetchTranscript(videoId: string): Promise<string> {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map(t => t.text).join(' ');
    } catch (error: any) {
        console.warn(`Transcript not available for (${videoId}):`, error.message);
        return "";
    }
}

export async function resolveChannelId(url: string) {
    try {
        const videos = await YouTube.search(url, { limit: 1, type: "video" });
        if (videos.length > 0 && videos[0].channel) {
            return {
                id: videos[0].channel.id!,
                name: videos[0].channel.name || "Unknown Channel"
            };
        }

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
