"use client";

export const generateTopicUrl = (topic: {
  slug: string;
  categories?: {
    slug: string;
    parent_category_id?: string;
    parent_category?: {
      slug: string;
    };
  };
}) => {
  if (!topic.categories) return `/topic/${topic.slug}`;

  // For hierarchical structure based on category level
  if (topic.categories.parent_category_id && topic.categories.parent_category) {
    // Level 3 category: /parent-slug/subcategory-slug/topic-slug
    return `/${topic.categories.parent_category.slug}/${topic.categories.slug}/${topic.slug}`;
  } else {
    // Level 2 category: /category-slug/topic-slug
    return `/${topic.categories.slug}/${topic.slug}`;
  }
};

export const generateCategoryUrl = (category: {
  slug: string;
  parent_category_id?: string;
  parent_category?: {
    slug: string;
  };
}) => {
  // For hierarchical structure based on category level
  if (category.parent_category_id && category.parent_category) {
    // Level 3 category: /parent-slug/subcategory-slug
    return `/${category.parent_category.slug}/${category.slug}`;
  } else {
    // Level 2 category: /category-slug
    return `/${category.slug}`;
  }
};

export const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .trim();
};
