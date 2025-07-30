"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCategoryRequests,
  useUpdateCategoryRequest,
  CategoryRequest, // <-- IMPORT CategoryRequest from the hook file
} from "@/hooks/useCategoryRequests"; // <-- Ensure this path is correct
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
} from "lucide-react";

// IMPORTANT: Remove any local CategoryRequest interface definition from here if it exists.
// It should now be imported from "@/hooks/useCategoryRequests".

export const CategoryRequestsManager = () => {
  const { requests, isLoading } = useCategoryRequests();
  const updateRequest = useUpdateCategoryRequest();

  // Now correctly typed using the imported interface
  const [selectedRequest, setSelectedRequest] =
    useState<CategoryRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return;

    await updateRequest.mutateAsync({
      id: selectedRequest.id,
      status,
      // Ensure adminNotes is passed as null if empty string, matching DB schema
      adminNotes: adminNotes.trim() === "" ? null : adminNotes.trim(),
      // These fields are now handled by the useUpdateCategoryRequest hook internally
      // reviewed_at: new Date().toISOString(),
      // reviewer_user_id: "CURRENT_ADMIN_USER_ID", // This should be handled by the hook
    });

    setIsReviewDialogOpen(false);
    setSelectedRequest(null);
    setAdminNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No category requests found</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{request.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {request.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(request.status)}
                {request.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setAdminNotes(request.admin_notes || "");
                      setIsReviewDialogOpen(true);
                    }}
                  >
                    Review
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Justification
                </Label>
                <p className="text-sm">{request.justification}</p>
              </div>

              {request.categories && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Parent Category
                  </Label>
                  <p className="text-sm">{request.categories.name}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>
                  {request.profiles?.username ||
                    request.requester_display_name ||
                    "Anonymous"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(request.created_at))} ago
                </span>
              </div>
              {request.reviewed_at && (
                <div className="flex items-center gap-1">
                  <span>
                    Reviewed by {request.reviewer?.username || "Unknown"}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(request.reviewed_at))} ago
                  </span>
                </div>
              )}
            </div>

            {request.admin_notes && (
              <div className="bg-muted p-3 rounded-md">
                <Label className="text-xs text-muted-foreground">
                  Admin Notes
                </Label>
                <p className="text-sm mt-1">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </Card>
      ))}

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Category Request</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedRequest.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.description}
                </p>
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview("rejected")}
                  disabled={updateRequest.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview("approved")}
                  disabled={updateRequest.isPending}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
