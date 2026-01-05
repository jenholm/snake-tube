import fs from 'fs';
import path from 'path';

export interface ChannelEntry {
    id: string;
    name: string;
}

const DATA_PATH = path.join(process.cwd(), 'data', 'channels.json');

export function getChannels(): ChannelEntry[] {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return [];
        }
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const parsed = JSON.parse(data);

        // Handle migration from old string[] format if it exists
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            return (parsed as string[]).map(id => ({ id, name: 'Unknown Channel' }));
        }

        return parsed;
    } catch (error) {
        console.error("Error reading channels file:", error);
        return [];
    }
}

export function saveChannels(channels: ChannelEntry[]) {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_PATH, JSON.stringify(channels, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing channels file:", error);
    }
}
