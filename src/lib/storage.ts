import fs from 'fs';
import path from 'path';
import { UserPreferences, SourceReputation } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_PREFS: UserPreferences = {
    blockedChannels: [],
    demotedChannels: [],
    demotedTopics: [],
    channelScores: {},
    topicScores: {},
    watchHistory: [],
    interestModel: {
        stablePreferences: "",
        sessionIntent: ""
    },
    sourceReputation: {},
    pendingQuestions: []
};

export function getPreferences(): UserPreferences {
    if (!fs.existsSync(STORE_FILE)) {
        return DEFAULT_PREFS;
    }
    try {
        const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
        return { ...DEFAULT_PREFS, ...data };
    } catch (e) {
        return DEFAULT_PREFS;
    }
}

export function savePreferences(prefs: UserPreferences) {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(prefs, null, 2));
}

export function updateChannelScore(channelId: string, delta: number) {
    const prefs = getPreferences();
    const current = prefs.channelScores[channelId] || 0;
    prefs.channelScores[channelId] = current + delta;
    savePreferences(prefs);
}

export function updateTopicScore(topic: string, delta: number) {
    const prefs = getPreferences();
    const current = prefs.topicScores[topic] || 0;
    prefs.topicScores[topic] = current + delta;
    savePreferences(prefs);
}

export function updateSourceReputation(sourceId: string, metrics: { passed?: boolean; score?: number }) {
    const prefs = getPreferences();
    if (!prefs.sourceReputation[sourceId]) {
        prefs.sourceReputation[sourceId] = {
            passRate: 1,
            avgScore: 50,
            userEngagement: 0,
            totalTriaged: 0
        };
    }

    const rep = prefs.sourceReputation[sourceId];
    rep.totalTriaged += 1;

    if (metrics.passed !== undefined) {
        const alpha = 0.1;
        const currentPass = metrics.passed ? 1 : 0;
        rep.passRate = (1 - alpha) * rep.passRate + alpha * currentPass;
    }

    if (metrics.score !== undefined) {
        rep.avgScore = (rep.avgScore * (rep.totalTriaged - 1) + metrics.score) / rep.totalTriaged;
    }

    savePreferences(prefs);
}

export function getCategories(): string[] {
    // In snake-tube, categories might be derived from tags or predefined
    // For now, returning top topics from the interest model or rubric
    const prefs = getPreferences();
    const topics = new Set<string>();
    if (prefs.currentRubric) {
        Object.keys(prefs.currentRubric.topicWeights).forEach(t => topics.add(t));
    }
    return Array.from(topics);
}
