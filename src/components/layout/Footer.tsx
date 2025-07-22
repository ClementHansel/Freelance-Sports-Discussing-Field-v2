"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedForumStats } from "@/hooks/useEnhancedForumStats";
import { useForumSettings } from "@/hooks/useForumSettings";
import { useVisitors24h } from "@/hooks/useVisitors24h";
import { usePeakDailyVisitors } from "@/hooks/usePeakDailyVisitors";
import { useAutoPeakUpdate } from "@/hooks/useAutoPeakUpdate";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Users,
  Calendar,
} from "lucide-react";

const ContactFormModal = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Assuming 'send-contact-email' is a Supabase Edge Function or similar serverless function
      // and that `supabase.functions.invoke` is the correct client-side method to call it.
      const { data, error } = await supabase.functions.invoke(
        "send-contact-email",
        {
          body: formData,
        }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
      setOpen(false);
    } catch (error: unknown) {
      // Changed 'any' to 'unknown'
      console.error("Contact form error:", error);
      let errorMessage = "Failed to send message. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Using a regular button for the trigger, as asChild expects a single child */}
        <button className="text-sm hover:text-primary transition-colors text-left">
          Contact Us
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function Footer() {
  const { data: stats } = useEnhancedForumStats();
  const { getSetting } = useForumSettings();
  const { data: visitors24h } = useVisitors24h();
  const { data: peakData } = usePeakDailyVisitors();

  // Auto-update peak when current visitors exceed stored peak
  useAutoPeakUpdate();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Minor Hockey Talks</h3>
            <p className="text-sm text-muted-foreground">
              The premier community for minor hockey discussions and insights.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-medium">Quick Links</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <Link
                href="/rules"
                className="hover:text-primary transition-colors"
              >
                Forum Rules
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <ContactFormModal />
              <Link
                href="/blog"
                className="hover:text-primary transition-colors"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="font-medium">Follow Us</h4>
            <div className="flex space-x-3">
              {(() => {
                const facebookUrl = getSetting("social_facebook", "") as string; // Cast to string
                const cleanUrl = facebookUrl.replace(/^"(.*)"$/, "$1");
                return (
                  cleanUrl &&
                  cleanUrl !== "" && (
                    <a
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Follow us on Facebook" // Added title for accessibility
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )
                );
              })()}
              {(() => {
                const twitterUrl = getSetting("social_twitter", "") as string; // Cast to string
                const cleanUrl = twitterUrl.replace(/^"(.*)"$/, "$1");
                return (
                  cleanUrl &&
                  cleanUrl !== "" && (
                    <a
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Follow us on X (formerly Twitter)" // Added title for accessibility
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )
                );
              })()}
              {(() => {
                const instagramUrl = getSetting(
                  "social_instagram",
                  ""
                ) as string; // Cast to string
                const cleanUrl = instagramUrl.replace(/^"(.*)"$/, "$1");
                return (
                  cleanUrl &&
                  cleanUrl !== "" && (
                    <a
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Follow us on Instagram" // Added title for accessibility
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )
                );
              })()}
              {(() => {
                const youtubeUrl = getSetting("social_youtube", "") as string; // Cast to string
                const cleanUrl = youtubeUrl.replace(/^"(.*)"$/, "$1");
                return (
                  cleanUrl &&
                  cleanUrl !== "" && (
                    <a
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Subscribe to our YouTube channel" // Added title for accessibility
                    >
                      <Youtube className="h-5 w-5" />
                    </a>
                  )
                );
              })()}
            </div>
          </div>

          {/* Community Stats */}
          <div className="space-y-4">
            <h4 className="font-medium">Community</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {stats?.total_members || 0} Total Members
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  {visitors24h || 0} Visitors (24h)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  All-time Peak: {peakData?.peak_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Minor Hockey Talks. All rights
            reserved.
          </p>
          <p>Built with ❤️ for the hockey community</p>
        </div>
      </div>
    </footer>
  );
}
