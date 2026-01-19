import OpenAI from 'openai';
import { VideoItem, InterestModel, ScoringRubric, VideoContentCard, MicroQuestion } from './types';
import { savePreferences, getPreferences, updateSourceReputation, getCategories } from './storage';
import { fetchTranscript, fetchVideoDetails } from './youtube';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRubric(interestModel: InterestModel): Promise<ScoringRubric | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    try {
        const categories = getCategories();
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: `You are an AI architect. Convert the user's interest profile into a deterministic scoring rubric for YouTube videos.
Stable Preferences: "${interestModel.stablePreferences}"
Session Intent: "${interestModel.sessionIntent}"

Goal: Score videos. Reward user interests highly.
Output a JSON object:
{
  "version": 1,
  "topicWeights": {"topic_name": weight_0_to_1},
  "noveltyPreference": 0.5,
  "technicalDepthPreference": 0.5,
  "educationalPreference": 0.5,
  "instantJunkRules": ["rule 1", "rule 2"]
}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (content) {
            const rubric = JSON.parse(content) as ScoringRubric;
            rubric.generatedAt = new Date().toISOString();
            return rubric;
        }
    } catch (e) {
        console.error('Failed to generate rubric:', e);
    }
    return null;
}

export async function triageVideos(videos: VideoItem[], rubric: ScoringRubric): Promise<VideoItem[]> {
    if (!process.env.OPENAI_API_KEY) return videos;

    const batchSize = 25;
    const triagePromises = [];

    for (let i = 0; i < videos.length; i += batchSize) {
        const batch = videos.slice(i, i + batchSize);
        triagePromises.push((async () => {
            const input = batch.map((v, idx) => `${idx}: T:${v.title} | D:${v.description || ''}`).join('\n');
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo-0125",
                    messages: [
                        {
                            role: "system",
                            content: `Triage these YouTube videos based on this rubric: ${JSON.stringify(rubric)}.
Goal: Cheaply filter out junk (clickbait, low-quality shorts, irrelevant content).
Output JSON: {"results": [{"idx": 0, "status": "reject|maybe|good", "flags": ["clickbait", "low_quality"]}]}`
                        },
                        { role: "user", content: input }
                    ],
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0].message.content;
                if (content) {
                    const results = JSON.parse(content).results;
                    batch.forEach((video, idx) => {
                        const res = results.find((r: any) => r.idx === idx);
                        video.triageStatus = res?.status || 'maybe';
                        video.aiFlags = res?.flags || [];
                    });
                }
            } catch (e) {
                console.error('Triage failed for batch', e);
            }
        })());
    }

    await Promise.all(triagePromises);
    return videos;
}

export async function extractVideoContentCard(video: VideoItem): Promise<VideoContentCard | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    const sourceText = video.transcript || video.description || video.title;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [
                {
                    role: "system",
                    content: `Extract a semantic content card from this video data (transcript or description).
Output JSON: 
{
  "summary": ["bullet 1", "bullet 2"],
  "claims": ["fact 1"],
  "entities": {"people": [], "brands": [], "technologies": []},
  "metadata": {"depth": "shallow|deep", "educational_value": 0.8, "is_tutorial": true, "is_review": false, "is_entertainment": false, "is_news": false}
}`
                },
                { role: "user", content: sourceText.slice(0, 5000) }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        return content ? (JSON.parse(content) as VideoContentCard) : null;
    } catch (e) {
        console.error('Content extraction failed', e);
        return null;
    }
}

export async function scoreVideosWithAI(videos: VideoItem[]): Promise<VideoItem[]> {
    const prefs = getPreferences();
    if (!process.env.OPENAI_API_KEY) return videos;

    let rubric = prefs.currentRubric;
    if (!rubric || (Date.now() - new Date(rubric.generatedAt).getTime() > 24 * 60 * 60 * 1000)) {
        rubric = await generateRubric(prefs.interestModel) || undefined;
        if (rubric) {
            prefs.currentRubric = rubric;
            savePreferences(prefs);
        }
    }
    if (!rubric) return videos;

    console.log(`[AI Scoring] Triaging ${videos.length} videos...`);
    const triageResults = await triageVideos(videos, rubric);
    const pool = triageResults.filter(v => v.triageStatus !== 'reject');

    if (pool.length === 0) return videos;

    // Detailed scoring for top candidates
    const candidates = pool.slice(0, 20); // Limit to top 20 for cost/speed
    const nonCandidates = pool.slice(20);

    console.log(`[AI Scoring] Detailed scoring top ${candidates.length} candidates...`);

    await Promise.all(candidates.map(async (video) => {
        if (!video.description || !video.tags || video.tags.length === 0) {
            const details = await fetchVideoDetails(video.id);
            video.description = details.description || video.description;
            video.tags = details.tags || video.tags;
        }
        if (!video.transcript) {
            video.transcript = await fetchTranscript(video.id);
        }
        if (!video.contentCard) {
            video.contentCard = await extractVideoContentCard(video) || undefined;
        }
    }));

    const batchSize = 10;
    const scoringPromises = [];
    for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        scoringPromises.push((async () => {
            const input = batch.map((v, idx) => {
                let desc = v.description;
                if (v.contentCard) {
                    desc = `[AI SUMMARY]: ${v.contentCard.summary.join('. ')}\n[DEPTH]: ${v.contentCard.metadata.depth}`;
                }
                return `${idx}: ${v.title}\n${desc}\n[TAGS]: ${(v.tags || []).join(', ')}`;
            }).join('\n---\n');

            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo-0125",
                    messages: [
                        {
                            role: "system",
                            content: `Score these YouTube videos using this rubric: ${JSON.stringify(rubric)}.
Reward depth and educational value. Penalize clickbait.
Output JSON: {"scores": [{"idx": 0, "overall": 0.8, "topic_match": 0.9, "novelty": 0.5, "depth": 0.7, "credibility": 0.8, "junk_risk": 0.1, "why": ["..."], "filters_triggered": []}]}`
                        },
                        { role: "user", content: input }
                    ],
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0].message.content;
                if (content) {
                    const results = JSON.parse(content).scores;
                    batch.forEach((video, idx) => {
                        const res = results.find((r: any) => r.idx === idx);
                        if (res) {
                            video.score = res.overall * 100;
                            video.explanation = res;
                        }
                    });
                }
            } catch (e) {
                console.error('Detailed scoring failed for batch', e);
            }
        })());
    }

    await Promise.all(scoringPromises);

    const finalScored = [...candidates, ...nonCandidates];

    // Update reputation and apply diversity penalty
    const seenChannels = new Map<string, number>();
    finalScored.forEach(v => {
        const rep = prefs.sourceReputation[v.channelId];
        if (rep) {
            if (rep.passRate > 0.8) v.score = (v.score || 0) * 1.1;
            if (rep.passRate < 0.3) v.score = (v.score || 0) * 0.7;
        }

        const count = seenChannels.get(v.channelId) || 0;
        if (count > 2) v.score = (v.score || 0) * 0.8;
        seenChannels.set(v.channelId, count + 1);

        updateSourceReputation(v.channelId, {
            passed: v.triageStatus !== 'reject',
            score: v.score
        });
    });

    return finalScored.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export async function generateMicroQuestions(videos: VideoItem[], rubric: ScoringRubric): Promise<MicroQuestion[]> {
    if (!process.env.OPENAI_API_KEY || videos.length === 0) return [];

    const prefs = getPreferences();

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [
                {
                    role: "system",
                    content: `You are a Curator-Learner Agent for YouTube videos. Refine the user's interest model.
Current Interest Model:
Stable: "${prefs.interestModel.stablePreferences}"
Session: "${prefs.interestModel.sessionIntent}"

Output JSON: {"questions": [{"id": "uniq_id", "question": "...", "options": ["...", "..."], "context": "Reason for asking", "topic": "Category"}]}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        return content ? JSON.parse(content).questions : [];
    } catch (e) {
        console.error('Failed to generate micro-questions', e);
        return [];
    }
}
