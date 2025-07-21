// src/app/ads.txt/route.ts
import { NextResponse } from "next/server";
// Assuming useForumSettings or a similar utility can fetch settings server-side
// For demonstration, let's mock a server-side setting fetch
// In a real app, you might fetch this from a database or environment variable.

// Mock function to simulate fetching ads.txt content from settings
// In a real application, replace this with your actual data fetching logic (e.g., from Supabase)
async function getAdsTxtContentFromServer() {
  // Replace this with your actual logic to get 'ads_txt_content'
  // For example, if it's stored in Supabase:
  // const { data, error } = await supabase.from('forum_settings').select('ads_txt_content').single();
  // if (error) console.error('Error fetching ads.txt content:', error);
  // return data?.ads_txt_content || '# No ads.txt content configured from DB';

  // For now, a hardcoded example:
  return `google.com, pub-1234567890123456, DIRECT, f000000000000000
# Another ad network
example.com, pub-9876543210987654, RESELLER, 1a2b3c4d5e6f7g8h`;
}

export async function GET() {
  const adsTxtContent = await getAdsTxtContentFromServer();

  return new NextResponse(adsTxtContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
