// src/lib/serverDataFetcher.ts
import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { getRedisClient } from "./redis";
import { captureException } from "@sentry/nextjs";
import { RedisClientType } from "redis";
import { PostgrestError } from "@supabase/supabase-js";

// Import types from your hooks for consistency
import { Category } from "@/hooks/useCategories";
import { CategoryWithActivity } from "@/hooks/useCategoriesByActivity";
import {
    HotTopic as UseHotTopicsTopic, // Use this alias for the HotTopic type from useHotTopics
    PaginatedHotTopicsResult,
} from "@/hooks/useHotTopics"; // Import HotTopic from useHotTopics
import {
    PaginatedTopicsResult,
    Topic as UseTopicsTopic, // Use this alias for the Topic type from useTopics
} from "@/hooks/useTopics"; // Import Topic from useTopics
import { ForumSettingsMap, MappedSettingValue } from "@/hooks/useForumSettings";
import { Database, Json, Tables } from "@/integrations/supabase/types";
// FIXED: Import Post and ModerationStatus from their canonical sources
import { PaginatedPostsResult, Post } from "@/hooks/usePosts";
import { isValidModerationStatus, ModerationStatus } from "@/types/forum";

// For get_hot_topics RPC - Based on types.ts, updated_at is present, moderation_status is not
// This type should align with what the RPC *actually* returns, not necessarily the UseHotTopicsTopic interface
type GetHotTopicsRPCActualReturn = {
    id: string;
    title: string;
    content: string;
    author_id: string;
    category_id: string;
    is_pinned: boolean;
    is_locked: boolean;
    view_count: number;
    reply_count: number;
    last_reply_at: string;
    created_at: string;
    updated_at: string;
    username: string;
    avatar_url: string;
    category_name: string;
    category_color: string;
    category_slug: string;
    slug: string;
    hot_score: number;
    last_post_id: string;
    parent_category_id: string; // RPC returns string, but UseHotTopicsTopic allows null
    parent_category_slug: string;
    // moderation_status is NOT returned by get_hot_topics based on your types.ts
};

// For get_enriched_topics RPC - Based on types.ts, updated_at is present, moderation_status is string
type GetEnrichedTopicsRPCActualReturn = {
    id: string;
    title: string;
    content: string;
    author_id: string;
    category_id: string;
    is_pinned: boolean;
    is_locked: boolean;
    view_count: number;
    reply_count: number;
    last_reply_at: string;
    created_at: string;
    updated_at: string;
    slug: string;
    moderation_status: string; // RPC returns string, not literal union
    last_post_id: string;
    author_username: string;
    author_avatar_url: string;
    category_name: string;
    category_color: string;
    category_slug: string;
    parent_category_id: string; // RPC returns string, but UseTopicsTopic allows null
    // hot_score is NOT returned by get_enriched_topics based on your types.ts
};

// NEW: Type for the actual return of get_categories_by_activity RPC
// This type should match what your Supabase RPC function 'get_categories_by_activity' *actually* returns.
// If it returns more fields than listed here, you need to add them.
type GetCategoriesByActivityRPCActualReturn = {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    color: string | null;
    sort_order: number | null;
    is_active: boolean | null;
    created_at: string | null;
    level: number;
    parent_category_id: string | null;
    region: string | null;
    birth_year: number | null;
    play_level: string | null;
    last_activity_at: string | null; // This is from the RPC
    topic_count: number | null; // This is from the RPC
    post_count: number | null; // This is from the RPC
    // Add any other fields your RPC returns that are not in the base Category type
};

// Type for the raw data returned from the subcategories select query
// REMOVED: topics(count, posts(count)) from this type, as it's causing the SQL error.
// We will rely on topic_count and post_count from get_categories_by_activity RPC or separate queries.
type RawSubcategoryData = Tables<"categories"> & {
    topic_count: [{ count: number }] | null;
    post_count: [{ count: number }] | null; // Added post_count for subcategories
    last_activity_at: [{ last_reply_at: string }] | null;
};

// Type for the raw data returned from the topic select query in getInitialTopicData
type RawTopicData = Tables<"topics"> & {
    is_hidden?: boolean | null;
    hot_score?: number | null;
    is_public?: boolean | null;
    ip_address?: unknown;
    canonical_url?: string | null;
};

// Type for the raw data returned from the posts select query in getInitialTopicData
type RawPostData = Tables<"posts">;

// Cache expiration times in seconds
const CACHE_TTL_SHORT = 60;
const CACHE_TTL_LONG = 3600;

export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
): Promise<T> {
    let redis: RedisClientType | undefined;
    try {
        redis = await getRedisClient();

        if (!redis || !redis.isReady) {
            console.warn(
                "Redis client not ready or not connected. Proceeding without cache for key:",
                key,
            );
            const data = await fetcher();
            captureException(
                new Error(`Redis client not ready, skipping cache for ${key}`),
                {
                    level: "warning",
                    tags: { source: "redis_not_ready" },
                },
            );
            return data;
        }

        const cachedData = await redis.get(key);
        if (cachedData) {
            console.log(`Cache hit for key: ${key}`);
            return JSON.parse(cachedData) as T;
        }

        console.log(`Cache miss for key: ${key}, fetching data...`);
        const data = await fetcher();

        if (redis.isReady) {
            await redis.setEx(key, ttl, JSON.stringify(data));
            console.log(`Data cached for key: ${key}`);
        } else {
            console.warn(
                `Redis client became unavailable after data fetch. Skipping cache set for key: ${key}`,
            );
            captureException(
                new Error(
                    `Redis client unavailable after fetch, skipping cache set for ${key}`,
                ),
                {
                    level: "warning",
                    tags: { source: "redis_unavailable_after_fetch" },
                },
            );
        }
        return data;
    } catch (error) {
        console.error(`Error fetching or caching data for key ${key}:`, error);
        captureException(error, {
            level: "error",
            tags: { source: "get_cached_data_error", cacheKey: key },
            extra: { key, ttl },
        });
        return fetcher();
    }
}

// --- Data Fetching Functions for Forum Home Page ---

export async function getInitialForumData() {
    const supabase = createServerSupabaseClient();
    const limit = 10;
    const currentPage = 1;

    // Fetch Hot Topics using RPC
    const fetchHotTopics = async () => {
        const [topicsResult, countResult] = await Promise.all([
            supabase.rpc("get_hot_topics", {
                limit_count: limit,
                offset_count: 0,
            }),
            supabase.rpc("get_hot_topics_count"),
        ]);

        if (topicsResult.error) {
            console.error(
                "Error fetching hot topics via RPC:",
                topicsResult.error,
            );
            captureException(topicsResult.error, {
                level: "error",
                tags: { rpc: "get_hot_topics" },
            });
            throw topicsResult.error;
        }
        if (countResult.error) {
            console.error(
                "Error fetching hot topics count via RPC:",
                countResult.error,
            );
            captureException(countResult.error, {
                level: "error",
                tags: { rpc: "get_hot_topics_count" },
            });
            throw countResult.error;
        }

        // Map RPC return to UseHotTopicsTopic
        const topics: UseHotTopicsTopic[] =
            (topicsResult.data as GetHotTopicsRPCActualReturn[]).map(
                (item) => ({
                    id: item.id,
                    title: item.title,
                    content: item.content || null,
                    author_id: item.author_id || null,
                    category_id: item.category_id,
                    is_pinned: item.is_pinned,
                    is_locked: item.is_locked,
                    is_hidden: null, // Not returned by RPC, explicitly null
                    view_count: item.view_count,
                    reply_count: item.reply_count,
                    last_reply_at: item.last_reply_at,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    slug: item.slug,
                    hot_score: item.hot_score,
                    last_post_id: item.last_post_id,
                    // Ensure parent_category_id and moderation_status are correctly mapped
                    parent_category_id: item.parent_category_id || null, // RPC returns string, UseHotTopicsTopic allows null
                    parent_category_slug: item.parent_category_slug || null,
                    moderation_status: null, // Not returned by get_hot_topics RPC, so explicitly null
                    username: item.username,
                    avatar_url: item.avatar_url,
                    category_name: item.category_name,
                    category_color: item.category_color,
                    category_slug: item.category_slug,
                    profiles: {
                        username: item.username,
                        avatar_url: item.avatar_url,
                        id: item.author_id || "", // Ensure id is provided
                        bio: null,
                        created_at: null,
                        reputation: null,
                        updated_at: null,
                    },
                    categories: {
                        name: item.category_name,
                        color: item.category_color,
                        slug: item.category_slug,
                        parent_category_id: item.parent_category_id || null,
                        id: item.category_id, // Ensure id is provided
                    },
                }),
            );

        const finalTotalCount = countResult.data as number;
        const totalPages = Math.ceil(finalTotalCount / limit);

        return {
            data: topics,
            totalCount: finalTotalCount,
            totalPages,
            currentPage,
        } as PaginatedHotTopicsResult;
    };

    const hotTopics = await getCachedData(
        "hot_topics_initial",
        fetchHotTopics,
        CACHE_TTL_SHORT,
    );

    // Fetch New Topics using RPC (adjusted call and added server-side sorting)
    const fetchNewTopics = async () => {
        const [topicsResult, countResult] = await Promise.all([
            supabase.rpc("get_enriched_topics", {
                p_category_id: undefined,
                p_limit: limit,
                p_offset: 0,
            }),
            supabase.rpc("get_enriched_topics_count", {
                p_category_id: undefined,
            }),
        ]);

        if (topicsResult.error) {
            console.error(
                "Error fetching new topics via RPC:",
                topicsResult.error,
            );
            captureException(topicsResult.error, {
                level: "error",
                tags: { rpc: "get_enriched_topics_new" },
            });
            throw topicsResult.error;
        }
        if (countResult.error) {
            console.error(
                "Error fetching new topics count via RPC:",
                countResult.error,
            );
            captureException(countResult.error, {
                level: "error",
                tags: { rpc: "get_enriched_topics_count_new" },
            });
            throw countResult.error;
        }

        const topics: UseTopicsTopic[] =
            (topicsResult.data as GetEnrichedTopicsRPCActualReturn[]).map(
                (item) => ({
                    id: item.id,
                    title: item.title,
                    content: item.content || null,
                    author_id: item.author_id || null,
                    category_id: item.category_id,
                    is_pinned: item.is_pinned,
                    is_locked: item.is_locked,
                    is_hidden: null,
                    view_count: item.view_count,
                    reply_count: item.reply_count,
                    last_reply_at: item.last_reply_at,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    slug: item.slug,
                    hot_score: null,
                    last_post_id: item.last_post_id,
                    moderation_status: isValidModerationStatus(
                        item.moderation_status,
                    ), // Apply validation
                    ip_address: null,
                    is_anonymous: null,
                    is_public: null,
                    canonical_url: null,
                    profiles: item.author_username
                        ? {
                            username: item.author_username,
                            avatar_url: item.author_avatar_url,
                            id: item.author_id || "", // Ensure id is provided
                            bio: null,
                            created_at: null,
                            reputation: null,
                            updated_at: null,
                        }
                        : null,
                    categories: item.category_name
                        ? {
                            name: item.category_name,
                            color: item.category_color,
                            slug: item.category_slug,
                            parent_category_id: item.parent_category_id || null,
                            id: item.category_id, // Ensure id is provided
                        }
                        : null,
                }),
            );

        // --- Server-side sorting for "New Topics" ---
        topics.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA; // Descending order for 'new'
        });

        const finalTotalCount = countResult.data as number;
        const totalPages = Math.ceil(finalTotalCount / limit);

        return {
            data: topics,
            totalCount: finalTotalCount,
            totalPages,
            currentPage,
        } as PaginatedTopicsResult;
    };

    const newTopics = await getCachedData(
        "new_topics_initial",
        fetchNewTopics,
        CACHE_TTL_SHORT,
    );

    // Fetch Top Topics using RPC (adjusted call and added server-side sorting)
    const fetchTopTopics = async () => {
        const [topicsResult, countResult] = await Promise.all([
            supabase.rpc("get_enriched_topics", {
                p_category_id: undefined,
                p_limit: limit,
                p_offset: 0,
            }),
            supabase.rpc("get_enriched_topics_count", {
                p_category_id: undefined,
            }),
        ]);

        if (topicsResult.error) {
            console.error(
                "Error fetching top topics via RPC:",
                topicsResult.error,
            );
            captureException(topicsResult.error, {
                level: "error",
                tags: { rpc: "get_enriched_topics_top" },
            });
            throw topicsResult.error;
        }
        if (countResult.error) {
            console.error(
                "Error fetching top topics count via RPC:",
                countResult.error,
            );
            captureException(countResult.error, {
                level: "error",
                tags: { rpc: "get_enriched_topics_count_top" },
            });
            throw countResult.error;
        }

        const topics: UseTopicsTopic[] =
            (topicsResult.data as GetEnrichedTopicsRPCActualReturn[]).map(
                (item) => ({
                    id: item.id,
                    title: item.title,
                    content: item.content || null,
                    author_id: item.author_id || null,
                    category_id: item.category_id,
                    is_pinned: item.is_pinned,
                    is_locked: item.is_locked,
                    is_hidden: null,
                    view_count: item.view_count,
                    reply_count: item.reply_count,
                    last_reply_at: item.last_reply_at,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    slug: item.slug,
                    hot_score: null,
                    last_post_id: item.last_post_id,
                    moderation_status: isValidModerationStatus(
                        item.moderation_status,
                    ), // Apply validation
                    ip_address: null,
                    is_anonymous: null,
                    is_public: null,
                    canonical_url: null,
                    profiles: item.author_username
                        ? {
                            username: item.author_username,
                            avatar_url: item.author_avatar_url,
                            id: item.author_id || "", // Ensure id is provided
                            bio: null,
                            created_at: null,
                            reputation: null,
                            updated_at: null,
                        }
                        : null,
                    categories: item.category_name
                        ? {
                            name: item.category_name,
                            color: item.category_color,
                            slug: item.category_slug,
                            parent_category_id: item.parent_category_id || null,
                            id: item.category_id, // Ensure id is provided
                        }
                        : null,
                }),
            );

        // --- Server-side sorting for "Top Topics" ---
        topics.sort((a, b) => {
            const viewsA = a.view_count ?? 0;
            const viewsB = b.view_count ?? 0;
            return viewsB - viewsA; // Descending order for 'top'
        });

        const finalTotalCount = countResult.data as number;
        const totalPages = Math.ceil(finalTotalCount / limit);

        return {
            data: topics,
            totalCount: finalTotalCount,
            totalPages,
            currentPage,
        } as PaginatedTopicsResult;
    };

    const topTopics = await getCachedData(
        "top_topics_initial",
        fetchTopTopics,
        CACHE_TTL_SHORT,
    );

    // Fetch Categories (Level 1, 2, 3) - This is for the main forum page, not sidebar
    const fetchCategories = async (level: number) => {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("level", level)
            .order("sort_order", { ascending: true });

        if (error) {
            console.error(
                `Error fetching level ${level} categories:`,
                error.message,
            );
            captureException(error, {
                level: "error",
                tags: { source: `fetch_level${level}_categories` },
            });
            return [];
        }
        return (data || []).map((
            row: Database["public"]["Tables"]["categories"]["Row"],
        ) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            slug: row.slug,
            color: row.color,
            sort_order: row.sort_order,
            is_active: row.is_active,
            created_at: row.created_at,
            level: row.level,
            parent_category_id: row.parent_category_id,
            region: row.region,
            birth_year: row.birth_year,
            play_level: row.play_level,
            requires_moderation: row.requires_moderation,
            canonical_url: row.canonical_url,
            meta_description: row.meta_description,
            meta_keywords: row.meta_keywords,
            meta_title: row.meta_title,
            og_description: row.og_description,
            og_image: row.og_image,
            og_title: row.og_title, // FIXED: Changed 'item.og_title' to 'row.og_title'
        })) as Category[];
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

    const fetchForumSettings = async () => {
        const { data: allSettings, error: allSettingsError } = await supabase
            .from("forum_settings")
            .select("*")
            .order("category", { ascending: true })
            .order("setting_key", { ascending: true });

        if (allSettingsError) {
            console.error(
                "Error fetching all forum settings for mapping:",
                allSettingsError.message,
            );
            captureException(allSettingsError, {
                level: "error",
                tags: { source: "fetch_forum_settings" },
            });
            throw allSettingsError;
        }

        const mappedSettings: Record<string, MappedSettingValue> = {};
        allSettings?.forEach(
            (
                settingRow:
                    Database["public"]["Tables"]["forum_settings"]["Row"],
            ) => {
                let value: Json = settingRow.setting_value;
                // Ensure boolean values are correctly typed as boolean, not string
                if (settingRow.setting_type === "boolean") {
                    value = value === "true" || value === true; // Handle both string "true" and boolean true
                } else if (value === null || value === undefined) {
                    value = ""; // Default to empty string for null/undefined non-booleans
                }

                mappedSettings[settingRow.setting_key] = {
                    value,
                    type: settingRow.setting_type,
                    category: settingRow.category, // FIXED: Changed 'setting.category' to 'settingRow.category'
                    description: settingRow.description, // FIXED: Changed 'setting.description' to 'settingRow.description'
                    isPublic: settingRow.is_public, // FIXED: Changed 'setting.is_public' to 'settingRow.is_public'
                };
            },
        );

        // NEW: Add fallback for 'category_request_enabled' if not present
        if (!mappedSettings["category_request_enabled"]) {
            mappedSettings["category_request_enabled"] = {
                value: true, // Default to true if not found in DB
                type: "boolean",
                category: "moderation", // Or 'general', consistent with your other settings
                description:
                    "Enable or disable category request feature (default fallback)",
                isPublic: true,
            };
        }

        return mappedSettings;
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

interface InitialCategoryData {
    category: Category | null;
    topics: PaginatedTopicsResult | null;
    subcategories: CategoryWithActivity[] | null;
    forumSettings: ForumSettingsMap | null;
}

export async function getInitialCategoryData(
    categorySlug: string,
    page: number = 1,
    limit: number = 10,
    subcategorySlug?: string,
): Promise<InitialCategoryData> {
    const supabase = createServerSupabaseClient();
    const cacheKey = `category-data:${categorySlug}${
        subcategorySlug ? `-${subcategorySlug}` : ""
    }:${page}:${limit}`;

    try {
        const cachedData = await getCachedData(
            cacheKey,
            async () => {
                console.log(
                    `Fetching fresh data for category: ${categorySlug}${
                        subcategorySlug ? `/${subcategorySlug}` : ""
                    }`,
                );
                let category: Category | null = null;
                let topics: PaginatedTopicsResult | null = null;
                let subcategories: CategoryWithActivity[] | null = null;
                let forumSettings: ForumSettingsMap | null = null;

                try {
                    let categoryQuery = supabase
                        .from("categories")
                        .select("*")
                        .eq("is_active", true);

                    if (subcategorySlug) {
                        const { data: parentCategoryData, error: parentError } =
                            await supabase
                                .from("categories")
                                .select("id")
                                .eq("slug", categorySlug)
                                .single();

                        if (parentError) {
                            console.error(
                                "Error fetching parent category:",
                                parentError,
                            );
                            throw parentError;
                        }

                        categoryQuery = categoryQuery
                            .eq("slug", subcategorySlug)
                            .eq("parent_category_id", parentCategoryData.id);
                    } else {
                        categoryQuery = categoryQuery.eq("slug", categorySlug);
                    }

                    const { data: categoryData, error: categoryError } =
                        await categoryQuery.single();

                    if (
                        categoryError &&
                        (categoryError as PostgrestError).code !== "PGRST116"
                    ) {
                        console.error(
                            `Error fetching category by slug ${categorySlug}/${
                                subcategorySlug || ""
                            }:`,
                            categoryError,
                        );
                        captureException(categoryError, {
                            level: "error",
                            tags: { source: "fetch_category_by_slug" },
                            extra: { categorySlug, subcategorySlug },
                        });
                        throw categoryError;
                    }
                    category = categoryData
                        ? ({
                            id: categoryData.id,
                            name: categoryData.name,
                            description: categoryData.description,
                            slug: categoryData.slug,
                            color: categoryData.color,
                            sort_order: categoryData.sort_order,
                            is_active: categoryData.is_active,
                            created_at: categoryData.created_at,
                            level: categoryData.level,
                            parent_category_id: categoryData.parent_category_id,
                            region: categoryData.region,
                            birth_year: categoryData.birth_year,
                            play_level: categoryData.play_level,
                            requires_moderation:
                                categoryData.requires_moderation,
                            canonical_url: categoryData.canonical_url,
                            meta_description: categoryData.meta_description,
                            meta_keywords: categoryData.meta_keywords,
                            meta_title: categoryData.meta_title,
                            og_description: categoryData.og_description,
                            og_image: categoryData.og_image,
                            og_title: categoryData.og_title,
                        })
                        : null;

                    if (category) {
                        const offset = (page - 1) * limit;
                        const [topicsResult, countResult] = await Promise.all([
                            supabase.rpc("get_enriched_topics", {
                                p_category_id: category.id,
                                p_limit: limit,
                                p_offset: offset,
                            }),
                            supabase.rpc("get_enriched_topics_count", {
                                p_category_id: category.id,
                            }),
                        ]);

                        if (topicsResult.error) {
                            console.error(
                                `Error fetching topics for category ${category.id} via RPC:`,
                                topicsResult.error,
                            );
                            captureException(topicsResult.error, {
                                level: "error",
                                tags: { rpc: "get_enriched_topics_category" },
                                extra: { categoryId: category.id },
                            });
                            throw topicsResult.error;
                        }
                        if (countResult.error) {
                            console.error(
                                `Error fetching topics count for category ${category.id} via RPC:`,
                                countResult.error,
                            );
                            captureException(countResult.error, {
                                level: "error",
                                tags: {
                                    rpc: "get_enriched_topics_count_category",
                                },
                                extra: { categoryId: category.id },
                            });
                            throw countResult.error;
                        }

                        const fetchedTopics: UseTopicsTopic[] = (topicsResult
                            .data as GetEnrichedTopicsRPCActualReturn[])
                            .map(
                                (item) => ({
                                    id: item.id,
                                    title: item.title,
                                    content: item.content || null,
                                    author_id: item.author_id || null,
                                    category_id: item.category_id, // Corrected from topic.category_id
                                    is_pinned: item.is_pinned,
                                    is_locked: item.is_locked,
                                    is_hidden: null,
                                    view_count: item.view_count,
                                    reply_count: item.reply_count,
                                    last_reply_at: item.last_reply_at,
                                    created_at: item.created_at,
                                    updated_at: item.updated_at,
                                    slug: item.slug,
                                    hot_score: null,
                                    last_post_id: item.last_post_id,
                                    moderation_status: isValidModerationStatus(
                                        item.moderation_status,
                                    ), // Apply validation
                                    ip_address: null,
                                    is_anonymous: null,
                                    is_public: null,
                                    canonical_url: null,
                                    profiles: item.author_username
                                        ? {
                                            username: item.author_username,
                                            avatar_url: item.author_avatar_url,
                                            id: item.author_id || "",
                                            bio: null,
                                            created_at: null,
                                            reputation: null,
                                            updated_at: null,
                                        }
                                        : null,
                                    categories: item.category_name
                                        ? {
                                            name: item.category_name,
                                            color: item.category_color,
                                            slug: item.category_slug,
                                            parent_category_id:
                                                item.parent_category_id || null,
                                            id: item.category_id,
                                        }
                                        : null,
                                }),
                            );

                        topics = {
                            data: fetchedTopics,
                            totalCount: countResult.data as number,
                            totalPages: Math.ceil(
                                (countResult.data as number) / limit,
                            ),
                            currentPage: page,
                        };

                        // FIXED: Simplified select for subcategories to avoid GROUP BY error
                        // We will fetch topic_count and post_count using separate RPCs or simpler queries
                        const {
                            data: subcategoriesRawData,
                            error: subcategoriesError,
                        } = await supabase
                            .from("categories")
                            .select(
                                `
                                id, name, description, slug, color, sort_order, is_active,
                                created_at, level, parent_category_id, region, birth_year,
                                play_level, requires_moderation, canonical_url,
                                meta_description, meta_keywords, meta_title,
                                og_description, og_image, og_title
                                `,
                            )
                            .eq("parent_category_id", category.id)
                            .eq("is_active", true)
                            .order("sort_order");

                        if (subcategoriesError) {
                            console.error(
                                `Error fetching subcategories for category ${category.id}:`,
                                subcategoriesError,
                            );
                            captureException(subcategoriesError, {
                                level: "error",
                                tags: { source: "fetch_subcategories" },
                                extra: { categoryId: category.id },
                            });
                            throw subcategoriesError;
                        }

                        // Fetch activity data for each subcategory separately
                        // This avoids the complex JOIN/GROUP BY issue in the main query
                        const subcategoriesWithActivityPromises =
                            (subcategoriesRawData || []).map(async (item) => {
                                const {
                                    data: activityData,
                                    error: activityError,
                                } = await supabase.rpc(
                                    "get_categories_by_activity",
                                    {
                                        p_parent_category_id: item.id, // Pass subcategory ID as parent
                                        p_category_level: item.level, // Pass subcategory level
                                    },
                                ).maybeSingle<
                                    GetCategoriesByActivityRPCActualReturn
                                >(); // Expect a single result for this category

                                if (activityError) {
                                    console.error(
                                        `Error fetching activity for subcategory ${item.id}:`,
                                        activityError,
                                    );
                                    captureException(activityError, {
                                        level: "error",
                                        tags: {
                                            source:
                                                "fetch_subcategory_activity",
                                        },
                                        extra: { categoryId: item.id },
                                    });
                                }

                                return {
                                    id: item.id,
                                    name: item.name,
                                    description: item.description,
                                    slug: item.slug,
                                    color: item.color,
                                    sort_order: item.sort_order,
                                    is_active: item.is_active,
                                    created_at: item.created_at,
                                    level: item.level,
                                    parent_category_id: item.parent_category_id,
                                    region: item.region,
                                    birth_year: item.birth_year,
                                    play_level: item.play_level,
                                    requires_moderation:
                                        item.requires_moderation,
                                    canonical_url: item.canonical_url,
                                    meta_description: item.meta_description,
                                    meta_keywords: item.meta_keywords,
                                    meta_title: item.meta_title,
                                    og_description: item.og_description,
                                    og_image: item.og_image,
                                    og_title: item.og_title,
                                    // Use data from RPC for counts and last activity
                                    topic_count: activityData?.topic_count ?? 0,
                                    post_count: activityData?.post_count ?? 0,
                                    last_activity_at:
                                        activityData?.last_activity_at || null,
                                    updated_at: null, // This field is not directly returned by the select, so keep as null or remove if not needed
                                } as CategoryWithActivity;
                            });

                        subcategories = await Promise.all(
                            subcategoriesWithActivityPromises,
                        );
                    }

                    const { data: settingsData, error: settingsError } =
                        await supabase
                            .from("forum_settings")
                            .select("*")
                            .order("category", { ascending: true })
                            .order("setting_key", { ascending: true });

                    if (settingsError) {
                        console.error(
                            "Error fetching forum settings:",
                            settingsError,
                        );
                        captureException(settingsError, {
                            level: "error",
                            tags: {
                                source: "fetch_forum_settings_category_page",
                            },
                            extra: { categorySlug, page, limit },
                        });
                        throw settingsError;
                    }

                    const transformedSettings: ForumSettingsMap = {};
                    settingsData.forEach((setting) => {
                        let value: Json = setting.setting_value;
                        // Ensure boolean values are correctly typed as boolean, not string
                        if (setting.setting_type === "boolean") {
                            value = value === "true" || value === true; // Handle both string "true" and boolean true
                        } else if (value === null || value === undefined) {
                            value = ""; // Default to empty string for null/undefined non-booleans
                        }

                        transformedSettings[setting.setting_key] = {
                            value,
                            type: setting.setting_type,
                            category: setting.category,
                            description: setting.description,
                            isPublic: setting.is_public,
                        };
                    });

                    // NEW: Add fallback for 'category_request_enabled' if not present
                    if (!transformedSettings["category_request_enabled"]) {
                        transformedSettings["category_request_enabled"] = {
                            value: true, // Default to true if not found in DB
                            type: "boolean",
                            category: "moderation", // Or 'general', consistent with your other settings
                            description:
                                "Enable or disable category request feature (default fallback)",
                            isPublic: true,
                        };
                    }

                    forumSettings = transformedSettings;

                    return {
                        category,
                        topics,
                        subcategories,
                        forumSettings,
                    };
                } catch (innerError) {
                    console.error(
                        "Inner fetcher error in getInitialCategoryData:",
                        innerError,
                    );
                    captureException(innerError, {
                        level: "error",
                        tags: {
                            source: "get_initial_category_data_inner_fetch",
                        },
                        extra: { categorySlug, page, limit, subcategorySlug },
                    });
                    throw innerError;
                }
            },
            CACHE_TTL_SHORT,
        );
        return cachedData;
    } catch (error) {
        console.error("Error in getInitialCategoryData (outer catch):", error);
        captureException(error, {
            level: "error",
            tags: { source: "get_initial_category_data_outer_catch" },
            extra: { categorySlug, page, limit, subcategorySlug },
        });
        throw error;
    }
}

interface InitialTopicData {
    topic: UseTopicsTopic | null;
    posts: PaginatedPostsResult | null;
    forumSettings: ForumSettingsMap | null;
}

interface GetInitialTopicDataOptions {
    categorySlug?: string;
    topicSlug?: string;
    topicId?: string;
    page?: number;
    limit?: number;
    subcategorySlug?: string;
}

export async function getInitialTopicData(
    options: GetInitialTopicDataOptions,
): Promise<InitialTopicData> {
    const {
        categorySlug,
        topicSlug,
        topicId,
        page = 1,
        limit = 20,
        subcategorySlug,
    } = options;

    const supabase = createServerSupabaseClient();
    const isLegacyRoute = !!topicId;
    const cacheKey = `topic-data:${
        isLegacyRoute
            ? topicId
            : `${categorySlug}-${
                subcategorySlug ? `${subcategorySlug}-` : ""
            }${topicSlug}`
    }:${page}:${limit}`;

    try {
        const cachedData = await getCachedData(
            cacheKey,
            async () => {
                console.log(`Fetching fresh data for topic: ${cacheKey}`);
                let topic: UseTopicsTopic | null = null;
                let posts: PaginatedPostsResult | null = null;
                let forumSettings: ForumSettingsMap | null = null;

                try {
                    let topicData: RawTopicData | null = null;
                    let topicError: Error | PostgrestError | null = null;

                    if (isLegacyRoute && topicId) {
                        const { data, error } = await supabase
                            .from("topics")
                            .select("*")
                            .eq("id", topicId)
                            .single();
                        topicData = data;
                        topicError = error;
                    } else if (categorySlug && topicSlug) {
                        let targetCategoryId: string | null = null;
                        if (subcategorySlug) {
                            const { data: parentCat, error: parentErr } =
                                await supabase
                                    .from("categories")
                                    .select("id")
                                    .eq("slug", categorySlug)
                                    .single();
                            if (parentErr) throw parentErr;

                            const { data: childCat, error: childErr } =
                                await supabase
                                    .from("categories")
                                    .select("id")
                                    .eq("slug", subcategorySlug)
                                    .eq("parent_category_id", parentCat.id)
                                    .single();
                            if (childErr) throw childErr;
                            targetCategoryId = childCat.id;
                        } else {
                            const { data: singleCat, error: singleErr } =
                                await supabase
                                    .from("categories")
                                    .select("id")
                                    .eq("slug", categorySlug)
                                    .single();
                            if (singleErr) throw singleErr;
                            targetCategoryId = singleCat.id;
                        }

                        if (!targetCategoryId) {
                            throw new Error(
                                "Target category not found for topic.",
                            );
                        }

                        const { data, error } = await supabase
                            .from("topics")
                            .select("*")
                            .eq("slug", topicSlug)
                            .eq("category_id", targetCategoryId)
                            .single();
                        topicData = data;
                        topicError = error;
                    } else {
                        throw new Error(
                            "Insufficient parameters to fetch topic.",
                        );
                    }

                    if (
                        topicError &&
                        (topicError as PostgrestError).code !== "PGRST116"
                    ) {
                        console.error(`Error fetching topic:`, topicError);
                        captureException(topicError, {
                            level: "error",
                            tags: { source: "fetch_topic_data" },
                            extra: {
                                categorySlug,
                                topicSlug,
                                topicId,
                                subcategorySlug,
                            },
                        });
                        throw topicError;
                    }

                    if (topicData) {
                        const [profileData, categoryData] = await Promise.all([
                            topicData.author_id
                                ? supabase
                                    .from("profiles")
                                    .select("*")
                                    .eq("id", topicData.author_id)
                                    .maybeSingle<Tables<"profiles">>()
                                : Promise.resolve({ data: null, error: null }),
                            supabase
                                .from("categories")
                                .select("*")
                                .eq("id", topicData.category_id)
                                .maybeSingle<Tables<"categories">>(),
                        ]);

                        if (profileData.error) {
                            console.error(
                                "Error fetching topic author profile:",
                                profileData.error,
                            );
                            captureException(profileData.error, {
                                level: "error",
                                tags: { source: "fetch_topic_author_profile" },
                                extra: { authorId: topicData.author_id },
                            });
                        }
                        if (categoryData.error) {
                            console.error(
                                "Error fetching topic category:",
                                categoryData.error,
                            );
                            captureException(categoryData.error, {
                                level: "error",
                                tags: { source: "fetch_topic_category" },
                                extra: { categoryId: topicData.category_id },
                            });
                        }

                        let lastPostId: string | null = null;
                        if ((topicData.reply_count ?? 0) > 0) {
                            const { data: lastPost } = await supabase
                                .from("posts")
                                .select("id")
                                .eq("topic_id", topicData.id)
                                .eq("moderation_status", "approved")
                                .order("created_at", { ascending: false })
                                .limit(1)
                                .maybeSingle<Tables<"posts">>();
                            lastPostId = lastPost?.id || null;
                        }

                        topic = {
                            id: topicData.id,
                            title: topicData.title,
                            content: topicData.content || null,
                            author_id: topicData.author_id || null,
                            category_id: topicData.category_id, // Corrected from topic.category_id
                            is_pinned: topicData.is_pinned || null,
                            is_locked: topicData.is_locked || null,
                            is_hidden: topicData.is_hidden ?? null,
                            view_count: topicData.view_count || null,
                            reply_count: topicData.reply_count || null,
                            last_reply_at: topicData.last_reply_at || null,
                            created_at: topicData.created_at || null,
                            updated_at: topicData.updated_at || null,
                            slug: topicData.slug || null,
                            hot_score: topicData.hot_score ?? null,
                            last_post_id: lastPostId,
                            moderation_status: isValidModerationStatus(
                                topicData.moderation_status,
                            ), // Apply validation
                            ip_address: topicData.ip_address as string | null,
                            is_anonymous: topicData.is_anonymous || null,
                            is_public: topicData.is_public ?? null,
                            canonical_url: topicData.canonical_url || null,
                            profiles: profileData.data
                                ? {
                                    username: profileData.data.username,
                                    avatar_url: profileData.data.avatar_url,
                                    id: profileData.data.id,
                                    bio: profileData.data.bio,
                                    created_at: profileData.data.created_at,
                                    reputation: profileData.data.reputation,
                                    updated_at: profileData.data.updated_at,
                                }
                                : null,
                            categories: categoryData.data
                                ? {
                                    id: categoryData.data.id,
                                    name: categoryData.data.name,
                                    color: categoryData.data.color,
                                    slug: categoryData.data.slug,
                                    parent_category_id:
                                        categoryData.data.parent_category_id ||
                                        null,
                                }
                                : null,
                        };

                        if (topic) {
                            await supabase.rpc("increment_view_count", {
                                topic_id: topic.id,
                            });
                        }

                        const offset = (page - 1) * limit;
                        const {
                            data: postsData,
                            error: postsError,
                            count: postsCount,
                        } = await supabase
                            .from("posts")
                            .select("*", { count: "exact" })
                            .eq("topic_id", topic?.id || "") // Added null check for topic.id
                            .order("created_at", { ascending: true })
                            .range(offset, offset + limit - 1);

                        if (postsError) {
                            console.error(
                                `Error fetching posts for topic ${
                                    topic?.id || ""
                                }:`, // Added null check
                                postsError,
                            );
                            captureException(postsError, {
                                level: "error",
                                tags: { source: "fetch_posts_data" },
                                extra: { topicId: topic?.id || "" }, // Added null check
                            });
                            throw postsError;
                        }

                        const postAuthorIds = (postsData || []).map((p) =>
                            p.author_id
                        ).filter(Boolean) as string[];
                        const uniquePostAuthorIds = [...new Set(postAuthorIds)];
                        const {
                            data: postProfilesData,
                            error: postProfilesError,
                        } = await supabase
                            .from("profiles")
                            .select("*")
                            .in("id", uniquePostAuthorIds);

                        if (postProfilesError) {
                            console.error(
                                "Error fetching post author profiles:",
                                postProfilesError,
                            );
                            captureException(postProfilesError, {
                                level: "error",
                                tags: { source: "fetch_post_author_profiles" },
                            });
                        }

                        const postProfilesMap = new Map(
                            (postProfilesData || []).map((p) => [p.id, p]),
                        );

                        const fetchedPosts: Post[] = (postsData || [])
                            .map((item: RawPostData) => ({
                                id: item.id,
                                topic_id: item.topic_id,
                                parent_post_id: item.parent_post_id,
                                author_id: item.author_id,
                                content: item.content,
                                created_at: item.created_at || null,
                                updated_at: item.updated_at || null,
                                is_anonymous: item.is_anonymous || null,
                                ip_address: item.ip_address as string | null,
                                // FIXED: Apply isValidModerationStatus here
                                moderation_status: isValidModerationStatus(
                                    item.moderation_status,
                                ),
                                vote_score: null,
                                profiles: item.author_id
                                    ? postProfilesMap.get(item.author_id) ||
                                        null
                                    : null,
                                temporary_users: null,
                                parent_post: undefined,
                            }));

                        posts = {
                            posts: fetchedPosts,
                            totalCount: postsCount || 0,
                            totalPages: Math.ceil(
                                (postsCount || 0) / limit,
                            ),
                            currentPage: page,
                        };
                    }

                    const { data: settingsData, error: settingsError } =
                        await supabase
                            .from("forum_settings")
                            .select("*")
                            .order("category", { ascending: true })
                            .order("setting_key", { ascending: true });

                    if (settingsError) {
                        console.error(
                            "Error fetching forum settings:",
                            settingsError,
                        );
                        captureException(settingsError, {
                            level: "error",
                            tags: {
                                source: "fetch_forum_settings_category_page",
                            },
                            extra: { categorySlug, page, limit },
                        });
                        throw settingsError;
                    }

                    const transformedSettings: ForumSettingsMap = {};
                    settingsData.forEach((setting) => {
                        let value: Json = setting.setting_value;
                        // Ensure boolean values are correctly typed as boolean, not string
                        if (setting.setting_type === "boolean") {
                            value = value === "true" || value === true; // Handle both string "true" and boolean true
                        } else if (value === null || value === undefined) {
                            value = ""; // Default to empty string for null/undefined non-booleans
                        }

                        transformedSettings[setting.setting_key] = {
                            value,
                            type: setting.setting_type,
                            category: setting.category,
                            description: setting.description,
                            isPublic: setting.is_public,
                        };
                    });

                    // NEW: Add fallback for 'category_request_enabled' if not present
                    if (!transformedSettings["category_request_enabled"]) {
                        transformedSettings["category_request_enabled"] = {
                            value: true, // Default to true if not found in DB
                            type: "boolean",
                            category: "moderation", // Or 'general', consistent with your other settings
                            description:
                                "Enable or disable category request feature (default fallback)",
                            isPublic: true,
                        };
                    }

                    forumSettings = transformedSettings;

                    return {
                        topic,
                        posts,
                        forumSettings,
                    };
                } catch (innerError) {
                    console.error(
                        "Inner fetcher error in getInitialTopicData:",
                        innerError,
                    );
                    captureException(innerError, {
                        level: "error",
                        tags: { source: "get_initial_topic_data_inner_fetch" },
                        extra: {
                            categorySlug,
                            topicSlug,
                            topicId,
                            page,
                            subcategorySlug,
                        },
                    });
                    throw innerError;
                }
            },
            CACHE_TTL_SHORT,
        );
        return cachedData;
    } catch (error) {
        console.error("Error in getInitialTopicData (outer catch):", error);
        captureException(error, {
            level: "error",
            tags: { source: "get_initial_topic_data_outer_catch" },
            extra: { categorySlug, topicSlug, topicId, page, subcategorySlug },
        });
        throw error;
    }
}

// NEW: getInitialTopicsPageData for /topics page
export async function getInitialTopicsPageData(
    page: number = 1,
    limit: number = 10,
    orderBy: "created_at" | "view_count" | "reply_count" | "hot_score" =
        "created_at",
    ascending: boolean = false,
) {
    const supabase = createServerSupabaseClient();
    const cacheKey =
        `topics-page-data:${page}:${limit}:${orderBy}:${ascending}`;

    try {
        const cachedData = await getCachedData(
            cacheKey,
            async () => {
                console.log(`Fetching fresh data for topics page: ${cacheKey}`);
                const offset = (page - 1) * limit;

                const [topicsResult, countResult] = await Promise.all([
                    supabase.rpc("get_enriched_topics", {
                        p_category_id: undefined, // All topics
                        p_limit: limit,
                        p_offset: offset,
                    }),
                    supabase.rpc("get_enriched_topics_count", {
                        p_category_id: undefined, // All topics
                    }),
                ]);

                if (topicsResult.error) {
                    console.error(
                        "Error fetching topics for topics page via RPC:",
                        topicsResult.error,
                    );
                    captureException(topicsResult.error, {
                        level: "error",
                        tags: { rpc: "get_enriched_topics_topics_page" },
                    });
                    throw topicsResult.error;
                }
                if (countResult.error) {
                    console.error(
                        "Error fetching topics count for topics page via RPC:",
                        countResult.error,
                    );
                    captureException(countResult.error, {
                        level: "error",
                        tags: { rpc: "get_enriched_topics_count_topics_page" },
                    });
                    throw countResult.error;
                }

                const fetchedTopics: UseTopicsTopic[] =
                    (topicsResult.data as GetEnrichedTopicsRPCActualReturn[])
                        .map(
                            (item) => ({
                                id: item.id,
                                title: item.title,
                                content: item.content || null,
                                author_id: item.author_id || null,
                                category_id: item.category_id,
                                is_pinned: item.is_pinned,
                                is_locked: item.is_locked,
                                is_hidden: null,
                                view_count: item.view_count,
                                reply_count: item.reply_count,
                                last_reply_at: item.last_reply_at,
                                created_at: item.created_at,
                                updated_at: item.updated_at,
                                slug: item.slug,
                                hot_score: null, // Not returned by get_enriched_topics RPC
                                moderation_status: isValidModerationStatus(
                                    item.moderation_status,
                                ), // Apply validation
                                last_post_id: item.last_post_id,
                                ip_address: null,
                                is_anonymous: null,
                                is_public: null,
                                canonical_url: null,
                                profiles: item.author_username
                                    ? {
                                        username: item.author_username,
                                        avatar_url: item.author_avatar_url,
                                        id: item.author_id || "",
                                        bio: null,
                                        created_at: null,
                                        reputation: null,
                                        updated_at: null,
                                    }
                                    : null,
                                categories: item.category_name
                                    ? {
                                        name: item.category_name,
                                        color: item.category_color,
                                        slug: item.category_slug,
                                        parent_category_id:
                                            item.parent_category_id || null,
                                        id: item.category_id,
                                    }
                                    : null,
                            }),
                        );

                // Server-side sorting based on orderBy and ascending
                fetchedTopics.sort((a, b) => {
                    let valA: number | string | null,
                        valB: number | string | null;

                    switch (orderBy) {
                        case "created_at":
                            valA = a.created_at
                                ? new Date(a.created_at).getTime()
                                : 0;
                            valB = b.created_at
                                ? new Date(b.created_at).getTime()
                                : 0;
                            break;
                        case "view_count":
                            valA = a.view_count ?? 0;
                            valB = b.view_count ?? 0;
                            break;
                        case "reply_count":
                            valA = a.reply_count ?? 0;
                            valB = b.reply_count ?? 0;
                            break;
                        case "hot_score":
                            // get_enriched_topics does not return hot_score, so this case might not be useful here
                            valA = a.hot_score ?? 0;
                            valB = b.hot_score ?? 0;
                            break;
                        default:
                            valA = a.created_at
                                ? new Date(a.created_at).getTime()
                                : 0;
                            valB = b.created_at
                                ? new Date(b.created_at).getTime()
                                : 0;
                            break;
                    }

                    if (typeof valA === "number" && typeof valB === "number") {
                        return ascending ? valA - valB : valB - valA;
                    }
                    return 0;
                });

                const totalCount = countResult.data as number;
                const totalPages = Math.ceil(totalCount / limit);

                // Fetch forum settings for the page
                const { data: settingsData, error: settingsError } =
                    await supabase
                        .from("forum_settings")
                        .select("*")
                        .order("category", { ascending: true })
                        .order("setting_key", { ascending: true });

                if (settingsError) {
                    console.error(
                        "Error fetching forum settings for topics page:",
                        settingsError,
                    );
                    captureException(settingsError, {
                        level: "error",
                        tags: { source: "fetch_forum_settings_topics_page" },
                    });
                    throw settingsError;
                }

                const forumSettings: ForumSettingsMap = {};
                settingsData.forEach((setting) => {
                    let value: Json = setting.setting_value;
                    if (setting.setting_type === "boolean") {
                        value = value === "true" || value === true;
                    } else if (value === null || value === undefined) {
                        value = "";
                    }
                    forumSettings[setting.setting_key] = {
                        value,
                        type: setting.setting_type,
                        category: setting.category,
                        description: setting.description,
                        isPublic: setting.is_public,
                    };
                });

                if (!forumSettings["category_request_enabled"]) {
                    forumSettings["category_request_enabled"] = {
                        value: true,
                        type: "boolean",
                        category: "moderation",
                        description:
                            "Enable or disable category request feature (default fallback)",
                        isPublic: true,
                    };
                }

                return {
                    topics: {
                        data: fetchedTopics,
                        totalCount,
                        totalPages,
                        currentPage: page,
                    } as PaginatedTopicsResult,
                    forumSettings,
                };
            },
            CACHE_TTL_SHORT,
        );
        return cachedData;
    } catch (error) {
        console.error(
            "Error in getInitialTopicsPageData (outer catch):",
            error,
        );
        captureException(error, {
            level: "error",
            tags: { source: "get_initial_topics_page_data_outer_catch" },
            extra: { page, limit, orderBy, ascending },
        });
        throw error;
    }
}

// NEW: getInitialCategoriesPageData for /categories page
export async function getInitialCategoriesPageData() {
    const supabase = createServerSupabaseClient();
    const cacheKey = `categories-page-data`;

    try {
        const cachedData = await getCachedData(
            cacheKey,
            async () => {
                console.log(
                    `Fetching fresh data for categories page: ${cacheKey}`,
                );

                const fetchCategories = async (level: number) => {
                    const { data, error } = await supabase
                        .from("categories")
                        .select("*")
                        .eq("is_active", true)
                        .eq("level", level)
                        .order("sort_order", { ascending: true });

                    if (error) {
                        console.error(
                            `Error fetching level ${level} categories for categories page:`,
                            error.message,
                        );
                        captureException(error, {
                            level: "error",
                            tags: {
                                source: `fetch_level${level}_categories_page`,
                            },
                        });
                        return [];
                    }
                    return (data || []).map((
                        row: Database["public"]["Tables"]["categories"]["Row"],
                    ) => ({
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        slug: row.slug,
                        color: row.color,
                        sort_order: row.sort_order,
                        is_active: row.is_active,
                        created_at: row.created_at,
                        level: row.level,
                        parent_category_id: row.parent_category_id,
                        region: row.region,
                        birth_year: row.birth_year,
                        play_level: row.play_level,
                        requires_moderation: row.requires_moderation,
                        canonical_url: row.canonical_url,
                        meta_description: row.meta_description,
                        meta_keywords: row.meta_keywords,
                        meta_title: row.meta_title,
                        og_description: row.og_description,
                        og_image: row.og_image,
                        og_title: row.og_title,
                    })) as Category[];
                };

                const level1Categories = await fetchCategories(1);
                const level2Categories = await fetchCategories(2);
                const level3Categories = await fetchCategories(3);

                return {
                    level1Categories,
                    level2Categories,
                    level3Categories,
                };
            },
            CACHE_TTL_LONG,
        );
        return cachedData;
    } catch (error) {
        console.error(
            "Error in getInitialCategoriesPageData (outer catch):",
            error,
        );
        captureException(error, {
            level: "error",
            tags: { source: "get_initial_categories_page_data_outer_catch" },
        });
        throw error;
    }
}

// NEW: getInitialSidebarData for layout
export async function getInitialSidebarData() {
    const supabase = createServerSupabaseClient();
    const cacheKey = `sidebar-data`;

    try {
        const cachedData = await getCachedData(
            cacheKey,
            async () => {
                console.log(`Fetching fresh data for sidebar: ${cacheKey}`);

                // Fetch categories by activity (all levels, no parent filter)
                const { data: categoriesData, error: categoriesError } =
                    await supabase.rpc("get_categories_by_activity", {
                        p_parent_category_id: undefined, // Fetch all categories
                        p_category_level: undefined, // Fetch all levels
                    });

                if (categoriesError) {
                    console.error(
                        "Error fetching categories by activity for sidebar:",
                        categoriesError.message,
                    );
                    captureException(categoriesError, {
                        level: "error",
                        tags: {
                            source: "fetch_categories_by_activity_sidebar",
                        },
                    });
                    throw categoriesError;
                }

                // FIXED: Use the new specific type GetCategoriesByActivityRPCActualReturn
                const categories: CategoryWithActivity[] =
                    (categoriesData || []).map((
                        item: GetCategoriesByActivityRPCActualReturn, // Use the specific RPC return type
                    ) => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        slug: item.slug,
                        color: item.color,
                        sort_order: item.sort_order,
                        is_active: item.is_active,
                        created_at: item.created_at,
                        level: item.level,
                        parent_category_id: item.parent_category_id,
                        region: item.region,
                        birth_year: item.birth_year,
                        play_level: item.play_level,
                        last_activity_at: item.last_activity_at || null,
                        topic_count: item.topic_count || 0, // Now correctly typed from RPC return
                        post_count: item.post_count || 0, // Now correctly typed from RPC return
                        // FIXED: These fields are NOT returned by get_categories_by_activity RPC,
                        // so we explicitly set them to null or remove if not needed in CategoryWithActivity
                        requires_moderation: null, // Not from RPC
                        canonical_url: null, // Not from RPC
                        meta_description: null, // Not from RPC
                        meta_keywords: null, // Not from RPC
                        meta_title: null, // Not from RPC
                        og_description: null, // Not from RPC
                        og_image: null, // Not from RPC
                        og_title: null, // Not from RPC
                    })) as CategoryWithActivity[];

                // Fetch forum settings
                const { data: settingsData, error: settingsError } =
                    await supabase
                        .from("forum_settings")
                        .select("*")
                        .order("category", { ascending: true })
                        .order("setting_key", { ascending: true });

                if (settingsError) {
                    console.error(
                        "Error fetching forum settings for sidebar:",
                        settingsError.message,
                    );
                    captureException(settingsError, {
                        level: "error",
                        tags: { source: "fetch_forum_settings_sidebar" },
                    });
                    throw settingsError;
                }

                const forumSettings: ForumSettingsMap = {};
                settingsData.forEach((setting) => {
                    let value: Json = setting.setting_value;
                    if (setting.setting_type === "boolean") {
                        value = value === "true" || value === true;
                    } else if (value === null || value === undefined) {
                        value = "";
                    }
                    forumSettings[setting.setting_key] = {
                        value,
                        type: setting.setting_type,
                        category: setting.category,
                        description: setting.description,
                        isPublic: setting.is_public,
                    };
                });

                if (!forumSettings["category_request_enabled"]) {
                    forumSettings["category_request_enabled"] = {
                        value: true,
                        type: "boolean",
                        category: "moderation",
                        description:
                            "Enable or disable category request feature (default fallback)",
                        isPublic: true,
                    };
                }

                return {
                    categories,
                    forumSettings,
                };
            },
            CACHE_TTL_LONG, // Cache sidebar data for a longer period
        );
        return cachedData;
    } catch (error) {
        console.error("Error in getInitialSidebarData (outer catch):", error);
        captureException(error, {
            level: "error",
            tags: { source: "get_initial_sidebar_data_outer_catch" },
        });
        throw error;
    }
}
