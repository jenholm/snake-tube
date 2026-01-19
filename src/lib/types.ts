export interface SourceReputation {
    passRate: number; // 0 to 1
    avgScore: number; // 0 to 100
    userEngagement: number; // Weighted clicks/actions
    totalTriaged: number;
}

export interface MicroQuestion {
    id: string;
    question: string;
    options: string[];
    context: string;
    topic?: string;
}

export interface VideoContentCard {
    summary: string[]; // bullets
    claims: string[];
    entities: {
        people: string[];
        brands: string[];
        technologies: string[];
    };
    metadata: {
        depth: 'shallow' | 'deep';
        educational_value: number; // 0 to 1
        is_tutorial: boolean;
        is_review: boolean;
        is_entertainment: boolean;
        is_news: boolean;
    };
}

export interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    viewCount: number;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
    description?: string;
    tags?: string[];
    transcript?: string;
    score?: number;
    triageStatus?: 'reject' | 'maybe' | 'good';
    aiFlags?: string[];
    contentCard?: VideoContentCard;
    explanation?: {
        overall: number;
        topic_match: number;
        novelty: number;
        depth: number;
        credibility: number;
        junk_risk: number;
        why: string[];
        filters_triggered: string[];
    };
}

export interface InterestModel {
    stablePreferences: string; // Long-term interests
    sessionIntent: string;    // Current focus
}

export interface ScoringRubric {
    version: number;
    generatedAt: string;
    topicWeights: Record<string, number>;
    noveltyPreference: number;
    technicalDepthPreference: number;
    educationalPreference: number;
    instantJunkRules: string[];
}

export interface UserPreferences {
    blockedChannels: string[];
    demotedChannels: string[];
    demotedTopics: string[];
    channelScores: Record<string, number>;
    topicScores: Record<string, number>;
    watchHistory: string[];
    interestModel: InterestModel;
    currentRubric?: ScoringRubric;
    sourceReputation: Record<string, SourceReputation>;
    pendingQuestions: MicroQuestion[];
}
