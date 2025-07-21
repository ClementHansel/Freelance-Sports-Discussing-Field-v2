"use client";

import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getUserIP } from "@/lib/utils/ipUtils";
import { AlertTriangle, Shield, Clock, Mail, ExternalLink } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  topicId?: string;
  contentType: "post" | "topic";
}

interface PreviousReportStatus {
  has_previous_reports: boolean;
  total_reports: number;
  approved_count: number;
  was_previously_approved: boolean;
  last_approved_at: string | null;
  should_show_warning: boolean;
}

interface ReporterBehavior {
  total_reports: number;
  dismissed_reports: number;
  reports_today: number;
  reports_last_hour: number;
  recent_repeat_reports: number;
  is_problematic_reporter: boolean;
  should_rate_limit: boolean;
}

interface ProtectionStatus {
  is_protected: boolean;
  protection_type?: "pinned" | "moderator_approved";
  approved_at?: string;
  approved_by?: string;
  moderator_id?: string;
  reason?: string;
  topic_title?: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or unwanted content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "copyright", label: "Copyright violation" },
  { value: "other", label: "Other" },
];

export const ReportModal = ({
  isOpen,
  onClose,
  postId,
  topicId,
  contentType,
}: ReportModalProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousReportStatus, setPreviousReportStatus] =
    useState<PreviousReportStatus | null>(null);
  const [reporterBehavior, setReporterBehavior] =
    useState<ReporterBehavior | null>(null);
  const [protectionStatus, setProtectionStatus] =
    useState<ProtectionStatus | null>(null);
  const [isAppealMode, setIsAppealMode] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Memoize checkReportStatus to prevent unnecessary re-renders and fix useEffect dependency warning
  const checkReportStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if content was previously approved
      const { data: previousStatus } = await supabase.rpc(
        "check_previous_report_status",
        {
          p_post_id: postId || undefined,
          p_topic_id: topicId || undefined,
        }
      );

      // Check moderation protection status
      const { data: protection } = await supabase.rpc(
        "check_moderation_protection",
        {
          p_content_id: (postId || topicId) as string,
          p_content_type: contentType,
        }
      );

      // Get reporter's IP and check behavior
      const reporterIP = await getUserIP();
      const { data: behavior } = await supabase.rpc("get_reporter_behavior", {
        p_reporter_id: user?.id || undefined,
        p_reporter_ip: reporterIP,
      });

      setPreviousReportStatus(
        previousStatus as unknown as PreviousReportStatus
      );
      setProtectionStatus(protection as unknown as ProtectionStatus);
      setReporterBehavior(behavior as unknown as ReporterBehavior);

      // Rate limit check
      if ((behavior as unknown as ReporterBehavior)?.should_rate_limit) {
        toast({
          title: "Rate Limited",
          description:
            "You have submitted too many reports recently. Please wait before reporting again.",
          variant: "destructive",
        });
        onClose(); // Close the modal if rate limited
        return;
      }
    } catch (error: unknown) {
      // Changed 'any' to 'unknown'
      console.error("Error checking report status:", error);
      if (error instanceof Error) {
        // Type guard
        toast({
          title: "Error",
          description: error.message || "Failed to check report status",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [postId, topicId, user?.id, contentType, toast, onClose]); // Added all dependencies

  // Check previous reports and reporter behavior when modal opens
  useEffect(() => {
    if (isOpen && (postId || topicId)) {
      checkReportStatus();
    }
  }, [isOpen, postId, topicId, checkReportStatus]); // Added checkReportStatus to dependencies

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    // If content was previously approved, require detailed description
    if (previousReportStatus?.was_previously_approved && !description.trim()) {
      toast({
        title: "Additional Details Required",
        description:
          "Since this content was previously reviewed and approved by an admin, please provide specific details about why you believe it should be reported again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get reporter's IP address
      const reporterIP = await getUserIP();

      const reportData = {
        reporter_id: user?.id || null, // Allow null for anonymous users
        reporter_ip_address: reporterIP,
        reason,
        description: description.trim() || null,
        ...(contentType === "post"
          ? { reported_post_id: postId, reported_topic_id: null }
          : { reported_topic_id: topicId, reported_post_id: null }),
      };

      const { error } = await supabase.from("reports").insert(reportData);

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast({
            title: "Already reported",
            description: "You have already reported this content",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // Show different messages based on protection status
        const isProtected = protectionStatus?.is_protected;
        const isPinned = protectionStatus?.protection_type === "pinned";

        toast({
          title: "Report submitted",
          description: isPinned
            ? "Your report has been submitted for review. The pinned topic will remain visible, but your feedback helps our moderation team maintain community standards."
            : isProtected
            ? "Your report has been submitted to the moderation team for review. Thank you for keeping our community safe."
            : "The content has been immediately hidden pending moderation review. Thank you for keeping our community safe.",
        });
        onClose();
        setReason("");
        setDescription("");
      }
    } catch (error: unknown) {
      // Changed 'any' to 'unknown'
      if (error instanceof Error) {
        // Type guard
        toast({
          title: "Error",
          description: error.message || "Failed to submit report",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppeal = async () => {
    if (!description.trim()) {
      toast({
        title: "Appeal Details Required",
        description:
          "Please explain why you believe this content should be reconsidered.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create content URL for context
      const contentUrl = window.location.origin + window.location.pathname;

      const { error } = await supabase.functions.invoke(
        "send-moderation-appeal",
        {
          body: {
            contentId: postId || topicId,
            contentType,
            reason: description.trim(),
            userEmail: userEmail.trim() || undefined,
            userName:
              userName.trim() || user?.email?.split("@")[0] || undefined,
            contentUrl,
          },
        }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Appeal Submitted",
        description:
          "Your appeal has been sent to the moderation team. You will receive a response within 24-48 hours.",
      });

      onClose();
      setDescription("");
      setUserEmail("");
      setUserName("");
      setIsAppealMode(false);
    } catch (error: unknown) {
      // Changed 'any' to 'unknown'
      if (error instanceof Error) {
        // Type guard
        toast({
          title: "Error",
          description: error.message || "Failed to submit appeal",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Report {contentType === "post" ? "Reply" : "Topic"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Moderation Protection Warning */}
              {protectionStatus?.is_protected && (
                <Alert
                  className={
                    protectionStatus.protection_type === "pinned"
                      ? "border-blue-200 bg-blue-50"
                      : "border-green-200 bg-green-50"
                  }
                >
                  <Shield
                    className={`h-4 w-4 ${
                      protectionStatus.protection_type === "pinned"
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                  />
                  <AlertDescription
                    className={
                      protectionStatus.protection_type === "pinned"
                        ? "text-blue-800"
                        : "text-green-800"
                    }
                  >
                    {protectionStatus.protection_type === "pinned" ? (
                      <>
                        <strong>Pinned Topic:</strong> This topic is pinned by
                        moderators and will remain visible even if reported.
                        Your report is still valuable for moderation review and
                        helping maintain community standards.
                        {protectionStatus.topic_title && (
                          <p className="mt-1 text-sm font-medium">
                            "{protectionStatus.topic_title}"
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <strong>Protected Content:</strong> This content was
                        reviewed and approved by{" "}
                        {protectionStatus.approved_by || "a moderator"}
                        {protectionStatus.approved_at && (
                          <span>
                            {" "}
                            on{" "}
                            {new Date(
                              protectionStatus.approved_at
                            ).toLocaleDateString()}
                          </span>
                        )}
                        .
                        {!isAppealMode ? (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsAppealMode(true)}
                              className="text-green-700 border-green-300 hover:bg-green-100"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Contact Admin About This Decision
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm">
                            Please provide your contact details and explain your
                            concerns below.
                          </p>
                        )}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Warning for previously approved content (legacy) */}
              {previousReportStatus?.was_previously_approved &&
                !protectionStatus?.is_protected && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Admin Review Notice:</strong> This content was
                      previously reviewed and approved by our moderation team
                      {previousReportStatus.last_approved_at && (
                        <span>
                          {" "}
                          on{" "}
                          {new Date(
                            previousReportStatus.last_approved_at
                          ).toLocaleDateString()}
                        </span>
                      )}
                      . If you still believe it violates our guidelines, please
                      provide detailed reasoning below.
                    </AlertDescription>
                  </Alert>
                )}

              {/* Warning for problematic reporters */}
              {reporterBehavior?.is_problematic_reporter && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Reporting Guidelines:</strong> Please ensure your
                    reports follow our community guidelines. Excessive or
                    inappropriate reporting may result in reporting
                    restrictions.
                  </AlertDescription>
                </Alert>
              )}

              {/* Rate limiting warning */}
              {reporterBehavior && reporterBehavior.reports_today > 3 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    You've submitted {reporterBehavior.reports_today} reports
                    today. Please make sure each report is necessary and follows
                    our guidelines.
                  </AlertDescription>
                </Alert>
              )}

              {/* Appeal Mode Contact Form */}
              {isAppealMode ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="userName" className="text-sm font-medium">
                        Name (optional)
                      </Label>
                      <input
                        type="text"
                        id="userName"
                        placeholder="Your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="userEmail"
                        className="text-sm font-medium"
                      >
                        Email (optional)
                      </Label>
                      <input
                        type="email"
                        id="userEmail"
                        placeholder="your@email.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="appeal-description"
                      className="text-sm font-medium"
                    >
                      Why do you believe this moderation decision should be
                      reconsidered? (required)
                    </Label>
                    <Textarea
                      id="appeal-description"
                      placeholder="Please provide specific details about why you believe this content should be reconsidered..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Be specific about which guidelines you believe are
                      violated. Include any new context or information not
                      available during the original review.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Standard Report Form */}
                  {(!protectionStatus?.is_protected ||
                    protectionStatus.protection_type === "pinned") && (
                    <div>
                      <Label className="text-sm font-medium">
                        Reason for reporting
                      </Label>
                      <RadioGroup
                        value={reason}
                        onValueChange={setReason}
                        className="mt-2"
                      >
                        {REPORT_REASONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={option.value}
                            />
                            <Label htmlFor={option.value} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {(!protectionStatus?.is_protected ||
                    protectionStatus.protection_type === "pinned") && (
                    <div>
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        {previousReportStatus?.was_previously_approved
                          ? "Detailed explanation (required)"
                          : protectionStatus?.protection_type === "pinned"
                          ? "Additional details about this pinned topic (optional)"
                          : "Additional details (optional)"}
                      </Label>
                      <Textarea
                        id="description"
                        placeholder={
                          previousReportStatus?.was_previously_approved
                            ? "Since this content was previously approved, please explain specifically why you believe it should be reconsidered..."
                            : protectionStatus?.protection_type === "pinned"
                            ? "Help moderators understand your concerns about this pinned topic..."
                            : "Provide more context about why you're reporting this content..."
                        }
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={
                          previousReportStatus?.was_previously_approved ? 4 : 3
                        }
                        className="mt-1"
                        required={previousReportStatus?.was_previously_approved}
                      />
                      {previousReportStatus?.was_previously_approved && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Required: Please provide specific details about the
                          policy violation.
                        </p>
                      )}
                      {protectionStatus?.protection_type === "pinned" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Your feedback helps moderators understand community
                          concerns about pinned content.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Community Guidelines Info */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Before reporting:</strong> Make sure the content
                  violates our community guidelines. False or excessive reports
                  may result in reporting restrictions. Our moderation team
                  reviews all reports carefully.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            {isAppealMode ? (
              <Button
                onClick={handleAppeal}
                disabled={isSubmitting || isLoading}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending Appeal..." : "Send Appeal to Admin"}
              </Button>
            ) : !protectionStatus?.is_protected ||
              protectionStatus.protection_type === "pinned" ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting
                  ? "Submitting..."
                  : protectionStatus?.protection_type === "pinned"
                  ? "Submit Report (Topic Stays Visible)"
                  : "Submit Report"}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
