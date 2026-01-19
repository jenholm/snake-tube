# Implement Agentic AI Personalization for Snake-Tube

Adapt the personalization logic from `snake-crawler` to work with YouTube video data, using transcripts, tags, and descriptions for scoring and triage.

## User Review Required

> [!IMPORTANT]
> This implementation will rely on fetching transcripts and video details. If transcripts are not available (e.g., auto-generation disabled), the AI will fall back to titles, descriptions, and tags.

> [!WARNING]
> Fetching transcripts and comments for every video in the feed might be slow. I will implement a caching mechanism or triage based on metadata first.

## Proposed Changes

### [Core Personalization Logic]

#### [NEW] [types.ts](file:///home/jenholm/snake-tube/src/lib/types.ts)
- Define `InterestModel`, `ScoringRubric`, `VideoContentCard`, and `UserPreferences` to match the structures used in `snake-crawler`.

#### [NEW] [ai.ts](file:///home/jenholm/snake-tube/src/lib/ai.ts)
- Adapt `generateRubric`, `triageVideos`, `extractVideoContentCard`, and `scoreVideosWithAI` from `snake-crawler`.
- Update prompts to focus on video content (visuals, pacing, verbal content) rather than article text.

#### [NEW] [storage.ts](file:///home/jenholm/snake-tube/src/lib/storage.ts)
- Implement `getPreferences` and `savePreferences` to store user interest models and rubrics in `data/store.json`.

---

### [YouTube Data Enhancement]

#### [MODIFY] [youtube.ts](file:///home/jenholm/snake-tube/src/lib/youtube.ts)
- Update `VideoItem` to include `description`, `tags`, and optionally `transcript`.
- Implement `fetchVideoDetails` to get tags and description using `youtube-sr` or `googleapis`.
- Implement `fetchTranscript` using a library like `youtube-transcript`.

---

### [API Integration]

#### [MODIFY] [route.ts](file:///home/jenholm/snake-tube/src/app/api/videos/route.ts)
- Integrate `scoreVideosWithAI` into the main video fetch loop.
- Apply triage and scoring before returning videos to the frontend.

#### [NEW] [route.ts](file:///home/jenholm/snake-tube/src/app/api/preferences/route.ts)
- Endpoint to get and update user preferences and interest model.

---

### [UI Enhancements]

#### [MODIFY] [page.tsx](file:///home/jenholm/snake-tube/src/app/page.tsx)
- Add a "Personalization" section to allow users to set their interest profile (stable preferences and session intent).
- Display AI scores and explanations on video cards.

## Verification Plan

### Automated Tests
- I will create a script `scripts/test_ai_scoring.ts` to verify that the AI can correctly score a set of dummy video data based on a sample rubric.
- I will verify the transcript fetching logic with a specific video ID.

### Manual Verification
- Run the app locally (`npm run dev`) and verify that the "Personalization" settings are saved.
- Verify that the feed reflects the user's interests after refreshing.
- Check the `data/store.json` for correct interest model updates.
