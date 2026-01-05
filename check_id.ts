import YouTube from "youtube-sr";
async function main() {
    const video = await YouTube.getVideo("https://www.youtube.com/watch?v=J9hj2YhBEkk");
    console.log("Channel ID:", video.channel?.id);
    console.log("Channel Name:", video.channel?.name);
}
main();
