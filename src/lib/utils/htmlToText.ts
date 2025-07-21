"use client";

/**
 * Converts HTML content to plain text for preview display
 * Strips HTML tags, decodes entities, and cleans up whitespace
 */
export function htmlToText(html: string): string {
  if (!html) return "";

  // Create a temporary div to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Get text content and clean it up
  const text = temp.textContent || temp.innerText || "";

  // Clean up extra whitespace and line breaks
  return text
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .trim(); // Remove leading/trailing whitespace
}
