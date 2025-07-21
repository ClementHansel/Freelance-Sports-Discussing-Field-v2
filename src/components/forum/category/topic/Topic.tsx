"use client";

import { TopicView } from "@/components/forum/TopicView";
import { useParams } from "next/navigation"; // Import useParams from next/navigation

export default function Topic() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;
  const subcategorySlug = params.subcategorySlug as string | undefined; // Assuming subcategory is optional
  const topicSlug = params.topicSlug as string;

  // TopicView already handles fetching the topic based on these slugs.
  // This page component primarily acts as a wrapper for TopicView.
  return <TopicView />;
}
