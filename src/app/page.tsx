"use client";

import { useState, useEffect } from "react";
import { VideoItem, InterestModel } from "@/lib/types";
import { Play, Plus, Youtube, Eye, Trash2, MoreVertical, Settings, Sparkles, Brain, Info, X } from "lucide-react";
import { BridgeAnimation } from "@/components/BridgeAnimation";

export default function Home() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualChannels, setManualChannels] = useState<{ id: string, name: string }[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [channelUrl, setChannelUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Personalization State
  const [showSettings, setShowSettings] = useState(false);
  const [interestModel, setInterestModel] = useState<InterestModel>({
    stablePreferences: "",
    sessionIntent: ""
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchPreferences();

    const savedWatched = localStorage.getItem("snakeTubeWatched");
    if (savedWatched) setWatchedVideos(JSON.parse(savedWatched));
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => setOpenMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.interestModel) {
          setInterestModel(data.interestModel);
        }
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        body: JSON.stringify({ interestModel }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setShowSettings(false);
        fetchVideos(); // Refresh feed with new preferences
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/channels");
      if (res.ok) {
        const data = await res.json();
        setManualChannels(data);
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [manualChannels]);

  const fetchVideos = async () => {
    if (manualChannels.length === 0) {
      setVideos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos`);
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
      setLoading(true);
      const resolveRes = await fetch("/api/resolve-channel", {
        method: "POST",
        body: JSON.stringify({ url: channelUrl }),
        headers: { "Content-Type": "application/json" },
      });
      const resolveData = await resolveRes.json();

      if (resolveData.channelId) {
        const addRes = await fetch("/api/channels", {
          method: "POST",
          body: JSON.stringify({
            channelId: resolveData.channelId,
            channelName: resolveData.channelName
          }),
          headers: { "Content-Type": "application/json" },
        });

        if (addRes.ok) {
          const updatedChannels = await addRes.json();
          setManualChannels(updatedChannels);
          setChannelUrl("");
        }
      } else {
        setError(resolveData.error || "Could not find channel");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/channels?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedChannels = await res.json();
        setManualChannels(updatedChannels);
      }
    } catch (err) {
      console.error("Error removing channel:", err);
    }
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
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-[#f50057]/30 selection:text-white">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-[#f50057]" />
                <h2 className="text-2xl font-bold tracking-tight">AI Personalization</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#f50057]">
                  <Sparkles className="w-4 h-4" />
                  <label className="text-xs font-black uppercase tracking-widest">Stable Preferences</label>
                </div>
                <p className="text-zinc-400 text-sm">Tell the AI what you always like (e.g., "Deep tech tutorials, space exploration, 80s synthwave").</p>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:border-[#f50057]/50 transition-all font-medium placeholder:text-zinc-600"
                  placeholder="Your long-term interests..."
                  value={interestModel.stablePreferences}
                  onChange={(e) => setInterestModel({ ...interestModel, stablePreferences: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#00f5a0]">
                  <Play className="w-4 h-4 fill-current" />
                  <label className="text-xs font-black uppercase tracking-widest">Current Session Intent</label>
                </div>
                <p className="text-zinc-400 text-sm">What are you in the mood for RIGHT NOW? (e.g., "Learning Next.js 14", "Funny cat videos to destress").</p>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:border-[#00f5a0]/50 transition-all font-medium placeholder:text-zinc-600"
                  placeholder="Your current focus..."
                  value={interestModel.sessionIntent}
                  onChange={(e) => setInterestModel({ ...interestModel, sessionIntent: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={savePreferences}
                  disabled={savingPrefs}
                  className="flex-1 bg-[#f50057] hover:bg-[#ff1a70] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#f50057]/20 disabled:opacity-50 active:scale-[0.98]"
                >
                  {savingPrefs ? "Updating Rubric..." : "Apply AI Transformation"}
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-8 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 mb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="hidden lg:block border-r border-white/10 pr-8">
              <BridgeAnimation />
            </div>

            <div className="flex items-center gap-3 mr-4 group cursor-pointer">
              <div className="w-10 h-10 bg-[#f50057] rounded-xl flex items-center justify-center shadow-lg shadow-[#f50057]/20 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-6 h-6 text-white fill-current" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic group-hover:text-[#f50057] transition-colors">Snake-Tube</h1>
            </div>

            <div className="hidden xl:block px-6 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md hover:border-[#f50057]/40 transition-all shadow-xl">
              <a
                href="https://enholm.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] uppercase tracking-[0.3em] font-extrabold text-zinc-400 hover:text-[#f50057] transition-colors whitespace-nowrap"
              >
                Enholm Heuristics
              </a>
            </div>
          </div>

          <form onSubmit={handleAddChannel} className="flex-1 max-w-lg hidden sm:flex gap-2">
            <input
              type="text"
              placeholder="Paste channel URL or handle..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f50057]/50 transition-colors"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#f50057] hover:bg-[#f50057]/90 p-2 px-4 rounded-lg transition-colors text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>Add</span>
            </button>
          </form>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
              title="Personalization Settings"
            >
              <Settings className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:rotate-45 transition-all" />
            </button>
            <button
              onClick={clearWatched}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline decoration-[#f50057]/30 underline-offset-4"
            >
              Reset Watched
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-12">
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
            disabled={loading}
            className="bg-[#f50057] p-2 rounded-lg transition-colors text-white disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 text-center font-medium animate-in slide-in-from-top-4">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">Vibe-Ranked Feed</h2>
              <div className="px-3 py-1 bg-[#f50057]/20 border border-[#f50057]/30 rounded-md">
                <span className="text-[10px] font-black uppercase text-[#f50057] tracking-[0.2em]">Agentic AI Active</span>
              </div>
            </div>
            <p className="text-zinc-400 text-sm mt-1">
              {loading ? "Aligning neurons and fetching videos..." : `${filteredVideos.length} videos from ${manualChannels.length} channels`}
            </p>
          </div>
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 px-8 rounded-full text-sm font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? "Processing..." : "Refresh Feed"}
          </button>
        </div>

        {loading && filteredVideos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-video bg-white/5 rounded-2xl"></div>
                <div className="h-4 bg-white/5 rounded-full w-3/4"></div>
                <div className="h-4 bg-white/5 rounded-full w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredVideos.map((video) => (
              <div key={video.id} className="video-card rounded-[2rem] overflow-hidden flex flex-col group relative bg-zinc-900/20 border border-white/5 hover:border-[#f50057]/20 hover:bg-zinc-900/40 transition-all duration-500">
                {/* AI Score Badge */}
                {video.score !== undefined && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                    <Sparkles className="w-3.5 h-3.5 text-[#f50057] fill-[#f50057]" />
                    <span className="text-[11px] font-bold text-white">{Math.round(video.score)}</span>
                  </div>
                )}

                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <button
                    onClick={() => markAsWatched(video.id)}
                    className="p-2.5 bg-black/60 backdrop-blur-xl hover:bg-[#f50057] rounded-full opacity-0 group-hover:opacity-100 transition-all text-white border border-white/10 shadow-2xl"
                    title="Mark as watched"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === video.id ? null : video.id);
                      }}
                      className="p-2.5 bg-black/60 backdrop-blur-xl hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all text-white border border-white/10 shadow-2xl"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenu === video.id && (
                      <div className="absolute right-0 mt-3 w-56 glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-40 animate-in zoom-in-95 duration-200">
                        <button
                          onClick={() => {
                            removeChannel(video.channelId);
                            setOpenMenu(null);
                          }}
                          className="w-full px-5 py-4 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Channel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-video overflow-hidden bg-zinc-900 relative group/thumb"
                  onClick={() => setOpenMenu(null)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                    {video.explanation && (
                      <p className="text-xs text-white/90 font-medium line-clamp-2 italic drop-shadow-md">
                        AI: "{video.explanation.why[0]}"
                      </p>
                    )}
                  </div>
                </a>

                <div className="p-6 flex-1 flex flex-col gap-3">
                  <h3 className="font-bold line-clamp-2 leading-tight text-zinc-100 group-hover:text-[#f50057] transition-all duration-300">
                    {video.title}
                  </h3>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider hover:text-zinc-300 transition-colors cursor-pointer">{video.channelTitle}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <span>{video.viewCount.toLocaleString()} views</span>
                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></span>
                        <span>{video.publishedAt}</span>
                      </div>

                      {video.contentCard?.metadata.depth === 'deep' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#00f5a0] tracking-[0.1em] px-2 py-0.5 bg-[#00f5a0]/10 border border-[#00f5a0]/20 rounded-md">
                          <Brain className="w-2.5 h-2.5" />
                          <span>Deep Insight</span>
                        </div>
                      )}
                    </div>

                    {/* Tags pass through */}
                    {video.explanation && video.explanation.why.length > 1 && (
                      <div className="pt-3 border-t border-white/5 hidden group-hover:block animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="text-[10px] text-zinc-400 italic">"{video.explanation.why.slice(1, 3).join(' ')}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredVideos.length === 0 && (
          <div className="text-center py-32 glass rounded-[3rem] border-dashed border-white/10 border-2">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Youtube className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold mb-2">Your feed is in cold storage.</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">Add some power channels using the bridge above to activate the Agentic AI.</p>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
            <Play className="w-6 h-6 text-zinc-600 fill-current" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} Enholm Heuristics
          </p>
          <div className="flex gap-8">
            <a href="https://enholm.net" target="_blank" className="text-[10px] font-black uppercase text-zinc-600 hover:text-[#f50057] transition-all tracking-widest">About Enholm Heuristics</a>
            <a href="#" className="text-[10px] font-black uppercase text-zinc-600 hover:text-[#f50057] transition-all tracking-widest">Github</a>
            <a href="#" className="text-[10px] font-black uppercase text-zinc-600 hover:text-[#f50057] transition-all tracking-widest">License</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
