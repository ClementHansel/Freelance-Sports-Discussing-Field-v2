"use client";

// URL redirect mappings for SEO-friendly category URLs
export const categoryRedirects: Record<string, string> = {
  // Canadian provinces
  ontario: "ontario-youth-hockey-forum",
  alberta: "alberta-youth-hockey-forum",
  "british-columbia": "british-columbia-youth-hockey-forum",
  quebec: "quebec-youth-hockey-forum",
  saskatchewan: "saskatchewan-youth-hockey-forum",
  manitoba: "manitoba-youth-hockey-forum",
  "nova-scotia": "nova-scotia-youth-hockey-forum",
  "new-brunswick": "new-brunswick-youth-hockey-forum",
  "newfoundland-labrador": "newfoundland-labrador-youth-hockey-forum",
  "prince-edward-island": "prince-edward-island-youth-hockey-forum",
  "northwest-territories": "northwest-territories-youth-hockey-forum",
  nunavut: "nunavut-youth-hockey-forum",
  yukon: "yukon-youth-hockey-forum",

  // US states
  california: "california-youth-hockey-forum",
  "new-york": "new-york-youth-hockey-forum",
  massachusetts: "massachusetts-youth-hockey-forum",
  michigan: "michigan-youth-hockey-forum",
  minnesota: "minnesota-youth-hockey-forum",
  illinois: "illinois-youth-hockey-forum",
  pennsylvania: "pennsylvania-youth-hockey-forum",
  colorado: "colorado-youth-hockey-forum",
  connecticut: "connecticut-youth-hockey-forum",
  "new-jersey": "new-jersey-youth-hockey-forum",
  wisconsin: "wisconsin-youth-hockey-forum",
  ohio: "ohio-youth-hockey-forum",
  alaska: "alaska-youth-hockey-forum",
  "new-hampshire": "new-hampshire-youth-hockey-forum",
  vermont: "vermont-youth-hockey-forum",
  maine: "maine-youth-hockey-forum",
  "rhode-island": "rhode-island-youth-hockey-forum",
  "north-dakota": "north-dakota-youth-hockey-forum",
  montana: "montana-youth-hockey-forum",
  washington: "washington-youth-hockey-forum",

  // Generic categories
  equipment: "youth-hockey-equipment-forum",
  training: "youth-hockey-training-forum",
  coaching: "youth-hockey-coaching-forum",
  general: "general-youth-hockey-discussion",
  tournaments: "youth-hockey-tournaments",
};

export const getRedirectUrl = (slug: string): string | null => {
  return categoryRedirects[slug] || null;
};

export const shouldRedirect = (slug: string): boolean => {
  return slug in categoryRedirects;
};
