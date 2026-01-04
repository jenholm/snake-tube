"use client";

import { useState, useEffect } from "react";
import { VideoItem } from "@/lib/youtube";
import { Play, Plus, Youtube, Eye, Trash2 } from "lucide-react";

export default function Home() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualChannels, setManualChannels] = useState<string[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [channelUrl, setChannelUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load local storage data
    const savedChannels = localStorage.getItem("snakeTubeChannels");
    if (savedChannels) {
      const parsed = JSON.parse(savedChannels);
      setManualChannels(parsed);
    } else {
      // Default channel (e.g., YouTube) if empty
      const defaults = ["UCBR8-60-B28hp2BmDPdntcQ"]; // YouTube's own channel
      setManualChannels(defaults);
      localStorage.setItem("snakeTubeChannels", JSON.stringify(defaults));
    }

    const savedWatched = localStorage.getItem("snakeTubeWatched");
    if (savedWatched) setWatchedVideos(JSON.parse(savedWatched));
  }, []);

  useEffect(() => {
    if (manualChannels.length > 0) {
      fetchVideos();
    }
  }, [manualChannels]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos?channels=${manualChannels.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      setVideos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl) return;

    try {
      const res = await fetch("/api/resolve-channel", {
        method: "POST",
        body: JSON.stringify({ url: channelUrl }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.channelId) {
        if (!manualChannels.includes(data.channelId)) {
          const newChannels = [...manualChannels, data.channelId];
          setManualChannels(newChannels);
          localStorage.setItem("snakeTubeChannels", JSON.stringify(newChannels));
        }
        setChannelUrl("");
      } else {
        setError(data.error || "Could not find channel");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeChannel = (id: string) => {
    const newChannels = manualChannels.filter(c => c !== id);
    setManualChannels(newChannels);
    localStorage.setItem("snakeTubeChannels", JSON.stringify(newChannels));
  };

  const markAsWatched = (videoId: string) => {
    const newWatched = [...watchedVideos, videoId];
    setWatchedVideos(newWatched);
    localStorage.setItem("snakeTubeWatched", JSON.stringify(newWatched));
  };

  const clearWatched = () => {
    setWatchedVideos([]);
    localStorage.removeItem("snakeTubeWatched");
  };

  const filteredVideos = videos.filter(v => !watchedVideos.includes(v.id));

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#f50057] rounded flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase">Snake-Tube Lite</h1>
          </div>

          <form onSubmit={handleAddChannel} className="flex-1 max-w-lg hidden sm:flex gap-2">
            <input
              type="text"
              placeholder="Paste channel URL (e.g., youtube.com/@handle)..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f50057]/50 transition-colors"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
            />
            <button
              type="submit"
              className="bg-[#f50057] hover:bg-[#f50057]/90 p-2 px-4 rounded-lg transition-colors text-white font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add</span>
            </button>
          </form>

          <div className="flex items-center gap-4">
            <button
              onClick={clearWatched}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
            >
              Reset Watched
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-12">
        {/* Mobile Input */}
        <form onSubmit={handleAddChannel} className="flex sm:hidden gap-2 mb-8">
          <input
            type="text"
            placeholder="Channel URL..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f50057]/50 transition-colors"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
          />
          <button
            type="submit"
            className="bg-[#f50057] p-2 rounded-lg transition-colors text-white"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold">Your Curated Feed</h2>
            <p className="text-zinc-400 text-sm">
              {loading ? "Fetching latest videos..." : `${filteredVideos.length} videos from ${manualChannels.length} channels`}
            </p>
          </div>
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-6 rounded-full text-sm font-medium disabled:opacity-50 transition-all"
          >
            {loading ? "Refreshing..." : "Refresh Feed"}
          </button>
        </div>

        {loading && filteredVideos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-video bg-white/5 rounded-xl"></div>
                <div className="h-4 bg-white/5 rounded w-3/4"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div key={video.id} className="video-card rounded-2xl overflow-hidden flex flex-col group relative">
                <button
                  onClick={() => markAsWatched(video.id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-black/70 hover:bg-[#f50057] rounded-full opacity-0 group-hover:opacity-100 transition-all text-white border border-white/10"
                  title="Mark as watched"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-video overflow-hidden bg-zinc-900"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </a>

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-semibold line-clamp-2 leading-tight group-hover:text-[#f50057] transition-colors">
                    {video.title}
                  </h3>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{video.channelTitle}</p>
                      <button
                        onClick={() => removeChannel(video.channelId)}
                        className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove channel from feed"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span>{video.viewCount.toLocaleString()} views</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                      <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredVideos.length === 0 && (
          <div className="text-center py-24 glass rounded-3xl border-dashed border-white/10 border-2">
            <Youtube className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-2">Your feed is empty.</p>
            <p className="text-zinc-600 text-sm">Add channels using the search bar above to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
