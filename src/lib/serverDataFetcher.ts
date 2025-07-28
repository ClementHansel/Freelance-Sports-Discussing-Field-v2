// src/lib/serverDataFetcher.ts
import { createServerSupabaseClient } from "@/integrations/supabase/server";
import redisClient from "./redis";
import { CategoryWithActivity } from "@/components/forum/category/CategoryRow";
import { Topic as UseTopicsTopic } from "@/hooks/useTopics"; // Import Topic from useTopics
import { HotTopic as UseHotTopicsTopic } from "@/hooks/useHotTopics"; // Import HotTopic from useHotTopics
import { Database } from "@/integrations/supabase/types"; // Import Database for RPC return types

// --- Define ACTUAL RPC Return Types ---
// These types are derived by inspecting what your Supabase RPCs actually return,
// including joined fields and computed columns, which might not be fully captured
// by Database['public']['Functions']['...']['Returns'][number] alone.

// For get_hot_topics RPC
// This type should precisely match the structure returned by your 'get_hot_topics' RPC.
// It includes fields from the base topics table, plus joined profiles and categories,
// and any computed fields like hot_score.
type GetHotTopicsRPCActualReturn = {
    id: string;
    title: string;
    content: string | null;
    author_id: string | null;
    category_id: string;
    is_pinned: boolean | null; // This must match what the RPC returns (potentially boolean or null)
    is_locked: boolean | null; // This must match what the RPC returns (potentially boolean or null)
    view_count: number;
    reply_count: number;
    last_reply_at: string;
    created_at: string;
    updated_at: string;
    username: string | null; // From joined profiles
    avatar_url: string | null; // From joined profiles
    category_name: string; // From joined categories
    category_color: string; // From joined categories
    category_slug: string | null; // From joined categories
    slug: string | null; // From base topics table or computed
    hot_score: number; // Computed by RPC
    last_post_id: string | null; // From base topics table or computed
    parent_category_id: string | null; // From joined categories
    parent_category_slug: string | null; // From joined categories
    moderation_status: "approved" | "pending" | "rejected" | null; // From base topics table or computed
};

// For get_enriched_topics RPC
// This type should precisely match the structure returned by your 'get_enriched_topics' RPC.
// It includes fields from the base topics table, plus joined profiles and categories,
// and any computed fields like hot_score, is_hidden.
type GetEnrichedTopicsRPCActualReturn = {
    id: string;
    title: string;
    content: string | null;
    author_id: string | null;
    category_id: string;
    is_pinned: boolean | null;
    is_locked: boolean | null;
    is_hidden: boolean | null; // From base topics table or computed
    view_count: number | null;
    reply_count: number | null;
    last_reply_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    slug: string | null; // Changed to string | null as per your useTopics.ts error
    hot_score: number | null; // Computed by RPC
    last_post_id: string | null; // From base topics table or computed
    moderation_status: string | null; // From base topics table or computed
    author_username: string | null; // From joined profiles
    author_avatar_url: string | null; // From joined profiles
    category_name: string | null; // From joined categories
    category_color: string | null; // From joined categories
    category_slug: string | null; // From joined categories
    parent_category_id: string | null; // From joined categories
};

// Cache expiration times in seconds
const CACHE_TTL_SHORT = 60; // 1 minute for frequently changing data like hot topics
const CACHE_TTL_LONG = 3600; // 1 hour for less frequently changing data like categories

export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
): Promise<T> {
    try {
        // Ensure Redis client is connected before attempting to use it
        if (!redisClient.isReady) {
            console.warn(
                "Redis client not connected, attempting to reconnect or proceeding without cache.",
            );
            await redisClient.connect().catch((err) =>
                console.error("Failed to reconnect Redis:", err)
            );
        }

        const cachedData = await redisClient.get(key);
        if (cachedData) {
            console.log(`Cache hit for key: ${key}`);
            return JSON.parse(cachedData) as T;
        }

        console.log(`Cache miss for key: ${key}, fetching data...`);
        const data = await fetcher();
        // Only set cache if Redis is ready
        if (redisClient.isReady) {
            await redisClient.setEx(key, ttl, JSON.stringify(data));
        } else {
            console.warn(
                `Redis client not ready, skipping cache set for key: ${key}`,
            );
        }
        return data;
    } catch (error) {
        console.error(`Error fetching or caching data for key ${key}:`, error);
        // Fallback to fetching data directly if Redis fails or cache operations fail
        return fetcher();
    }
}

// --- Data Fetching Functions (adapted from your hooks to use RPCs) ---

export async function getInitialForumData() {
    const supabase = createServerSupabaseClient();
    const limit = 10; // Consistent limit for initial fetches

    // Fetch Hot Topics using RPC
    const fetchHotTopics = async () => {
        const [topicsResult, countResult] = await Promise.all([
            supabase.rpc("get_hot_topics", {
                limit_count: limit,
                offset_count: 0, // Always fetch first page for initial load
            }),
            supabase.rpc("get_hot_topics_count"),
        ]);

        if (topicsResult.error) {
            console.error(
                "Error fetching hot topics via RPC:",
                topicsResult.error,
            );
            throw topicsResult.error;
        }
        if (countResult.error) {
            console.error(
                "Error fetching hot topics count via RPC:",
                countResult.error,
            );
            throw countResult.error;
        }

        // Map the RPC result to the UseHotTopicsTopic type
        // Use GetHotTopicsRPCActualReturn to accurately type the 'item'
        const topics: UseHotTopicsTopic[] =
            (topicsResult.data as GetHotTopicsRPCActualReturn[]).map(
                (item) => ({
                    id: item.id,
                    title: item.title,
                    content: item.content || null,
                    author_id: item.author_id || null,
                    category_id: item.category_id,
                    // Coerce boolean | null to boolean to match HotTopic interface in useHotTopics.ts
                    is_pinned: item.is_pinned ?? false, // Coerce null to false
                    is_locked: item.is_locked ?? false, // Coerce null to false
                    view_count: item.view_count,
                    reply_count: item.reply_count,
                    last_reply_at: item.last_reply_at,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    username: item.username || null,
                    avatar_url: item.avatar_url || null,
                    category_name: item.category_name,
                    category_color: item.category_color,
                    category_slug: item.category_slug || null,
                    slug: item.slug || null,
                    hot_score: item.hot_score ?? 0,
                    last_post_id: item.last_post_id || null,
                    parent_category_id: item.parent_category_id || null,
                    parent_category_slug: item.parent_category_slug || null,
                    moderation_status: item.moderation_status || null,
                }),
            );

        const finalTotalCount = countResult.data as number; // Declare totalCount here
        const totalPages = Math.ceil(finalTotalCount / limit);

        return { data: topics, totalCount: finalTotalCount, totalPages }; // Use finalTotalCount
    };

    const hotTopics = await getCachedData(
        "hot_topics_initial",
        fetchHotTopics,
        CACHE_TTL_SHORT,
    );

    // Fetch New Topics using RPC (assuming get_enriched_topics can sort by created_at)
    const fetchNewTopics = async () => {
        const [topicsResult, countResult] = await Promise.all([
            supabase.rpc("get_enriched_topics", {
                p_limit: limit,
                p_offset: 0,
                p_order_by: "created_at", // Assuming your RPC supports this
                p_ascending: false,
            }),
            supabase.rpc("get_enriched_topics_count", {
                p_category_id: undefined, // Assuming no category filter for new topics count
            }),
        ]);

        if (topicsResult.error) {
            console.error(
                "Error fetching new topics via RPC:",
                topicsResult.error,
            );
            throw topicsResult.error;
        }
        if (countResult.error) {
            console.error(
                "Error fetching new topics count via RPC:",
                countResult.error,
            );
            throw countResult.error;
        }

        // Map the RPC result to the UseTopicsTopic type
        // Use GetEnrichedTopicsRPCActualReturn to accurately type the 'item'
        const topics: UseTopicsTopic[] =
            (topicsResult.data as GetEnrichedTopicsRPCActualReturn[]).map(
                (item) => ({
                    id: item.id,
                    title: item.title,
                    content: item.content || null,
                    author_id: item.author_id || null,
                    category_id: item.category_id,
                    is_pinned: item.is_pinned || null,
                    is_locked: item.is_locked || null,
                    is_hidden: item.is_hidden || null,
                    view_count: item.view_count || null,
                    reply_count: item.reply_count || null,
                    last_reply_at: item.last_reply_at || null,
                    created_at: item.created_at || null,
                    updated_at: item.updated_at || null,
                    slug: item.slug || "", // Coerce string | null to string
                    hot_score: item.hot_score || null,
                    last_post_id: item.last_post_id || null,
                    moderation_status: item.moderation_status || null,
                    profiles: item.author_username
                        ? {
                            username: item.author_username,
                            avatar_url: item.author_avatar_url,
                        }
                        : null,
                    categories: item.category_name
                        ? {
                            name: item.category_name,
                            color: item.category_color,
                            slug: item.category_slug || "", // Coerce string | null to string
                            parent_category_id: item.parent_category_id,
                        }
                        : null,
                }),
            );

        const finalTotalCount = countResult.data as number; // Declare totalCount here
        const totalPages = Math.ceil(finalTotalCount / limit);

        return { data: topics, totalCount: finalTotalCount, totalPages }; // Use finalTotalCount
    };

    const newTopics = await getCachedData(
        "new_topics_initial",
        fetchNewTopics,
        CACHE_TTL_SHORT,
    );

    // Fetch Top Topics using RPC (assuming get_enriched_topics can sort by view_count)
    const fetchTopTopics = async () => {
        const [topicsResult, countResult] = await Promise.all([
            supabase.rpc("get_enriched_topics", {
                p_limit: limit,
                p_offset: 0,
                p_order_by: "view_count", // Assuming your RPC supports this
                p_ascending: false,
            }),
            supabase.rpc("get_enriched_topics_count", {
                p_category_id: undefined, // Assuming no category filter for top topics count
            }),
        ]);

        if (topicsResult.error) {
            console.error(
                "Error fetching top topics via RPC:",
                topicsResult.error,
            );
            throw topicsResult.error;
        }
        if (countResult.error) {
            console.error(
                "Error fetching top topics count via RPC:",
                countResult.error,
            );
            throw countResult.error;
        }

        // Map the RPC result to the UseTopicsTopic type
        // Use GetEnrichedTopicsRPCActualReturn to accurately type the 'item'
        const topics: UseTopicsTopic[] =
            (topicsResult.data as GetEnrichedTopicsRPCActualReturn[]).map(
                (item) => ({
                    id: item.id,
                    title: item.title,
                    content: item.content || null,
                    author_id: item.author_id || null,
                    category_id: item.category_id,
                    is_pinned: item.is_pinned || null,
                    is_locked: item.is_locked || null,
                    is_hidden: item.is_hidden || null,
                    view_count: item.view_count || null,
                    reply_count: item.reply_count || null,
                    last_reply_at: item.last_reply_at || null,
                    created_at: item.created_at || null,
                    updated_at: item.updated_at || null,
                    slug: item.slug || "", // Coerce string | null to string
                    hot_score: item.hot_score || null,
                    last_post_id: item.last_post_id || null,
                    moderation_status: item.moderation_status || null,
                    profiles: item.author_username
                        ? {
                            username: item.author_username,
                            avatar_url: item.author_avatar_url,
                        }
                        : null,
                    categories: item.category_name
                        ? {
                            name: item.category_name,
                            color: item.category_color,
                            slug: item.category_slug || "", // Coerce string | null to string
                            parent_category_id: item.parent_category_id,
                        }
                        : null,
                }),
            );

        const finalTotalCount = countResult.data as number; // Declare totalCount here
        const totalPages = Math.ceil(finalTotalCount / limit);

        return { data: topics, totalCount: finalTotalCount, totalPages }; // Use finalTotalCount
    };

    const topTopics = await getCachedData(
        "top_topics_initial",
        fetchTopTopics,
        CACHE_TTL_SHORT,
    );

    // Fetch Categories (Level 1, 2, 3) - still using .from().select() as RPCs for these weren't implied
    const fetchCategories = async (level: number) => {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("level", level)
            .order("name", { ascending: true }); // Order by name for consistency

        if (error) {
            console.error(
                `Error fetching level ${level} categories:`,
                error.message,
            );
            return [];
        }
        return data as CategoryWithActivity[];
    };

    const level1Forums = await getCachedData(
        "level1_forums",
        () => fetchCategories(1),
        CACHE_TTL_LONG,
    );
    const level2Forums = await getCachedData(
        "level2_forums",
        () => fetchCategories(2),
        CACHE_TTL_LONG,
    );
    const level3Forums = await getCachedData(
        "level3_forums",
        () => fetchCategories(3),
        CACHE_TTL_LONG,
    );

    // Fetch Forum Settings (assuming these are relatively static)
    const fetchForumSettings = async () => {
        const { data, error } = await supabase
            .from("forum_settings") // Assuming a table named 'forum_settings'
            .select("*")
            .single(); // Assuming settings are stored as a single row

        if (error && error.code !== "PGRST116") { // PGRST116 means no rows found
            console.error("Error fetching forum settings:", error.message);
            return {};
        }
        return data || {};
    };

    const forumSettings = await getCachedData(
        "forum_settings",
        fetchForumSettings,
        CACHE_TTL_LONG,
    );

    return {
        hotTopics,
        newTopics,
        topTopics,
        level1Forums,
        level2Forums,
        level3Forums,
        forumSettings,
    };
}
