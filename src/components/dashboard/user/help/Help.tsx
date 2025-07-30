// src/components/dashboard/user/help/Help.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  User,
  MessageSquare,
  Shield,
  Bug,
  Mail,
  FlaskConical, // Icon for conceptual features
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils"; // For conditional class names
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Assuming you have shadcn/ui Accordion

// ====================================================================================
// CONCEPTUAL DATA (REPLACE WITH REAL CONTENT)
//
// These are placeholders for help topics and answers. In a real application,
// this data would likely come from a CMS, a database, or markdown files.
// ====================================================================================

const conceptualFaqs = [
  {
    id: "faq1",
    question: "How do I update my profile information?",
    answer:
      "To update your profile, navigate to the 'Profile' section in your user dashboard and click on the 'Edit Profile' button. You can change your username, avatar, and other personal details there.",
    category: "Account Management",
  },
  {
    id: "faq2",
    question: "How do I create a new topic in the forum?",
    answer:
      "You can create a new topic by clicking the 'Create New Topic' button on the main forum page or from your dashboard's quick actions. Choose an appropriate category, add a title, and write your post.",
    category: "Posting & Content",
  },
  {
    id: "faq3",
    question: "What is 'Reputation' and how do I earn it?",
    answer:
      "Reputation reflects your standing in the community. You earn it by receiving upvotes on your posts and topics, having your answers marked as 'best answer', and generally contributing positively to discussions.",
    category: "Account Management",
  },
  {
    id: "faq4",
    question: "Why was my post/topic moderated or removed?",
    answer:
      "Posts or topics may be moderated if they violate our forum rules (e.g., spam, offensive content, off-topic discussions). Please review the 'Forum Rules' page for detailed guidelines. If you believe there was an error, you can contact moderation.",
    category: "Moderation & Rules",
  },
  {
    id: "faq5",
    question: "I found a bug or technical issue. What should I do?",
    answer:
      "If you encounter a bug, please provide as much detail as possible, including steps to reproduce the issue, your browser, and device. You can report it via the 'Contact Support' link below.",
    category: "Technical Support",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <Card
        className={cn(
          "border border-dashed border-gray-300 bg-gray-50 opacity-70",
          "relative"
        )}
      >
        <Badge
          variant="outline"
          className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 flex items-center gap-1"
        >
          <FlaskConical className="h-3 w-3" /> Conceptual Page
        </Badge>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-blue-600" /> Help & Support
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Find answers to common questions and get assistance with using Minor
            Hockey Talks.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 italic">
            This is a conceptual help page. The content below is for
            demonstration purposes and will be replaced with actual help
            documentation.
          </p>

          {/* Common Topics / FAQ Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-700" /> Common Topics
              (FAQ)
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {conceptualFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="font-medium text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    <p className="mb-2">{faq.answer}</p>
                    <Badge variant="secondary" className="text-xs">
                      Category: {faq.category}
                    </Badge>
                  </AccordionContent>
                </AccordionItem>
              ))}
              {conceptualFaqs.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No FAQ items available yet.
                </p>
              )}
            </Accordion>
          </section>

          {/* Quick Links Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-gray-700" /> Quick Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" asChild className="justify-start">
                <Link href="/rules">
                  <Shield className="mr-2 h-4 w-4" /> Forum Rules
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/privacy">
                  <Mail className="mr-2 h-4 w-4" /> Privacy Policy
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/terms">
                  <HelpCircle className="mr-2 h-4 w-4" /> Terms of Service
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/blog">
                  <MessageSquare className="mr-2 h-4 w-4" /> Latest
                  Announcements
                </Link>
              </Button>
            </div>
          </section>

          {/* Contact Support Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-700" /> Contact Support
            </h3>
            <p className="text-gray-700">
              Can't find what you're looking for? Our support team is here to
              help!
            </p>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="mailto:support@minorhockeytalks.com">
                <Mail className="mr-2 h-4 w-4" /> Email Support
              </Link>
            </Button>
            <p className="text-xs text-gray-600 mt-2 italic">
              (This email link is conceptual. You might want a contact form in a
              real application.)
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
