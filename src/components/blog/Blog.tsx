"use client";

import React from "react";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Blog posts will be loaded from a CMS or database in the future
// For now, using mock data. In a real app, this would come from props or a client-side fetch.
const blogPosts = [
  {
    id: "1",
    title: "Mastering the Slap Shot: A Beginner's Guide",
    excerpt:
      "Learn the fundamentals of a powerful slap shot, from grip to follow-through, to improve your game.",
    category: "Training",
    author: "Coach Mike",
    date: "2024-07-01",
    readTime: "5 min read",
  },
  {
    id: "2",
    title: "Choosing the Right Hockey Stick for Your Child",
    excerpt:
      "A comprehensive guide to selecting the perfect hockey stick based on size, flex, and material.",
    category: "Equipment",
    author: "Gear Guru",
    date: "2024-06-25",
    readTime: "7 min read",
  },
  {
    id: "3",
    title: "Building Team Chemistry Off the Ice",
    excerpt:
      "Strategies for coaches and parents to foster strong bonds and teamwork outside of practice and games.",
    category: "Team Building",
    author: "Team Leader",
    date: "2024-06-18",
    readTime: "6 min read",
  },
  {
    id: "4",
    title: "Nutrition Tips for Young Athletes",
    excerpt:
      "Fueling your minor hockey player for optimal performance and recovery with healthy eating habits.",
    category: "Health",
    author: "Sports Dietitian",
    date: "2024-06-10",
    readTime: "8 min read",
  },
  {
    id: "5",
    title: "Concussion Awareness in Minor Hockey: What Parents Need to Know",
    excerpt:
      "Understanding concussion symptoms, prevention, and safe return-to-play protocols.",
    category: "Safety",
    author: "Dr. Emily",
    date: "2024-06-01",
    readTime: "10 min read",
  },
  {
    id: "6",
    title: "Developing Stickhandling Skills at Home",
    excerpt:
      "Simple drills and techniques to practice stickhandling in your garage or backyard.",
    category: "Training",
    author: "Skill Builder",
    date: "2024-05-28",
    readTime: "4 min read",
  },
  {
    id: "7",
    title: "The Evolution of Hockey Skates: A Buyer's Guide",
    excerpt:
      "From traditional to modern designs, explore the features and benefits of different skate types.",
    category: "Equipment",
    author: "Skate Expert",
    date: "2024-05-20",
    readTime: "9 min read",
  },
  {
    id: "8",
    title: "Communication is Key: Parents, Coaches, and Players",
    excerpt:
      "Effective communication strategies to ensure a positive and productive minor hockey experience for everyone.",
    category: "Team Building",
    author: "Parent Advocate",
    date: "2024-05-15",
    readTime: "5 min read",
  },
];

const categories = [
  "All",
  "Training",
  "Equipment",
  "Team Building",
  "Health",
  "Safety",
];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredPosts =
    selectedCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Minor Hockey Talks Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights, tips, and stories from the world of minor hockey
        </p>
      </div>

      <div className="text-center mb-12 border-8 border-amber-700 p-4 ">
        <h2 className="text-4xl font-bold mb-4">This is a Mock Data</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Blog posts will be loaded from a CMS or database in the future. For
          now, using mock data to show some ideas. In a real app, this would
          come from props or a client-side fetch.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <Card
            key={post.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-muted relative">
              {/* Placeholder for image or dynamic content */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">
                  {post.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {post.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {post.readTime}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                {post.title}
              </h3>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="w-full group">
                Read More
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Coming Soon Message */}
      <div className="text-center mt-12 p-8 bg-muted/50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">
          More Content Coming Soon!
        </h2>
        <p className="text-muted-foreground mb-6">
          We're working on bringing you more valuable content about minor
          hockey. Stay tuned for regular updates, expert insights, and community
          stories.
        </p>
        <Button variant="outline">Subscribe for Updates</Button>
      </div>
    </div>
  );
};

export default Blog;
