-- Performance Optimization: Add strategic database indexes
-- These indexes will significantly improve query performance for common forum operations

-- Index for topics ordering by moderation status and creation date
-- This will speed up the main topics listing queries
CREATE INDEX IF NOT EXISTS idx_topics_moderation_created 
ON topics(moderation_status, created_at DESC) 
WHERE moderation_status = 'approved';

-- Index for posts within topics, ordered by creation date
-- This will speed up post loading within topic discussions
CREATE INDEX IF NOT EXISTS idx_posts_topic_moderation_created 
ON posts(topic_id, moderation_status, created_at) 
WHERE moderation_status = 'approved';

-- Index for topics within categories with pinning priority
-- This will speed up category-specific topic listing
CREATE INDEX IF NOT EXISTS idx_topics_category_pinned_reply 
ON topics(category_id, moderation_status, is_pinned DESC, last_reply_at DESC) 
WHERE moderation_status = 'approved';

-- Index for posts by author for user profile queries
CREATE INDEX IF NOT EXISTS idx_posts_author_created 
ON posts(author_id, created_at DESC) 
WHERE author_id IS NOT NULL AND moderation_status = 'approved';

-- Index for topics by author for user profile queries  
CREATE INDEX IF NOT EXISTS idx_topics_author_created 
ON topics(author_id, created_at DESC) 
WHERE author_id IS NOT NULL AND moderation_status = 'approved';

-- Index for active categories ordering
CREATE INDEX IF NOT EXISTS idx_categories_active_sort 
ON categories(is_active, sort_order, name) 
WHERE is_active = true;

-- Composite index for category hierarchy queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_level_active 
ON categories(parent_category_id, level, is_active, sort_order) 
WHERE is_active = true;