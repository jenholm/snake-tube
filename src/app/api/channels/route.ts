import { NextResponse } from "next/server";
import { getChannels, saveChannels, ChannelEntry } from "@/lib/db";

export async function GET() {
    const channels = getChannels();
    return NextResponse.json(channels);
}

export async function POST(request: Request) {
    try {
        const { channelId, channelName } = await request.json();
        if (!channelId) {
            return NextResponse.json({ error: "channelId is required" }, { status: 400 });
        }

        const channels = getChannels();
        if (!channels.find(c => c.id === channelId)) {
            channels.push({ id: channelId, name: channelName || 'Unknown Channel' });
            saveChannels(channels);
        }

        return NextResponse.json(channels);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get("id");

        if (!channelId) {
            return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
        }

        const channels = getChannels();
        const newChannels = channels.filter(c => c.id !== channelId);
        saveChannels(newChannels);

        return NextResponse.json(newChannels);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
