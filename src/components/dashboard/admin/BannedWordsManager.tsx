"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, TestTube } from "lucide-react";

interface BannedWord {
  id: string;
  word_pattern: string;
  severity: "warning" | "moderate" | "ban";
  category: "profanity" | "spam" | "harassment" | "general";
  match_type: "exact" | "partial" | "regex" | "wildcard";
  action: "block" | "replace" | "warn";
  replacement_text?: string;
  is_active: boolean;
  expires_at?: string;
  notes?: string;
  created_at: string;
}

export const BannedWordsManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [testContent, setTestContent] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [editingWord, setEditingWord] = useState<BannedWord | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch banned words
  const { data: bannedWords, isLoading } = useQuery({
    queryKey: ["banned-words"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_words")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BannedWord[];
    },
  });

  // Add/Update banned word
  const wordMutation = useMutation({
    mutationFn: async (
      wordData: Partial<BannedWord> & { word_pattern: string }
    ) => {
      if (wordData.id) {
        const { error } = await supabase
          .from("banned_words")
          .update(wordData)
          .eq("id", wordData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banned_words").insert(wordData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-words"] });
      toast({ title: "Banned word updated successfully" });
      setEditingWord(null);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating banned word:", error);
      toast({ title: "Failed to update banned word", variant: "destructive" });
    },
  });

  // Delete banned word
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banned_words")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-words"] });
      toast({ title: "Banned word deleted successfully" });
    },
    onError: (error) => {
      console.error("Error deleting banned word:", error);
      toast({ title: "Failed to delete banned word", variant: "destructive" });
    },
  });

  // Test content against banned words
  const testContentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase.rpc("process_banned_words", {
        content_text: content,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error) => {
      console.error("Error testing content:", error);
      toast({ title: "Failed to test content", variant: "destructive" });
    },
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "block":
        return <Badge variant="destructive">Block</Badge>;
      case "replace":
        return <Badge variant="secondary">Replace</Badge>;
      case "warn":
        return <Badge variant="outline">Warn</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "ban":
        return <Badge variant="destructive">Ban</Badge>;
      case "moderate":
        return <Badge variant="secondary">Moderate</Badge>;
      case "warning":
        return <Badge variant="outline">Warning</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "profanity":
        return <Badge variant="destructive">Profanity</Badge>;
      case "spam":
        return <Badge variant="secondary">Spam</Badge>;
      case "harassment":
        return <Badge variant="destructive">Harassment</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };

  const filteredWords = bannedWords?.filter(
    (word) => selectedCategory === "all" || word.category === selectedCategory
  );

  const WordForm = ({
    word,
    onSave,
  }: {
    word?: BannedWord;
    onSave: (data: any) => void;
  }) => {
    const [formData, setFormData] = useState({
      word_pattern: word?.word_pattern || "",
      severity: word?.severity || "moderate",
      category: word?.category || "general",
      match_type: word?.match_type || "exact",
      action: word?.action || "block",
      replacement_text: word?.replacement_text || "*Not Allowed*",
      is_active: word?.is_active ?? true,
      notes: word?.notes || "",
    });

    const getMatchTypeHelp = (type: string) => {
      switch (type) {
        case "wildcard":
          return 'Use * for wildcards (e.g., "fuck*" matches fuck, fucking, fuckers)';
        case "regex":
          return "Use regular expressions for complex patterns";
        case "partial":
          return "Matches if the word appears anywhere in the content";
        case "exact":
          return "Matches only complete words";
        default:
          return "";
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="word_pattern">Word/Pattern</Label>
          <Input
            id="word_pattern"
            value={formData.word_pattern}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, word_pattern: e.target.value }))
            }
            placeholder="Enter word or pattern (e.g., fuck* for wildcards)"
          />
          {formData.match_type && (
            <p className="text-xs text-muted-foreground mt-1">
              {getMatchTypeHelp(formData.match_type)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="action">Action</Label>
            <Select
              value={formData.action}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, action: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block Content</SelectItem>
                <SelectItem value="replace">Replace Words</SelectItem>
                <SelectItem value="warn">Warn Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, severity: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="ban">Ban</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.action === "replace" && (
          <div>
            <Label htmlFor="replacement_text">Replacement Text</Label>
            <Input
              id="replacement_text"
              value={formData.replacement_text}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  replacement_text: e.target.value,
                }))
              }
              placeholder="Text to replace banned words with"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="profanity">Profanity</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="match_type">Match Type</Label>
            <Select
              value={formData.match_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, match_type: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact Word</SelectItem>
                <SelectItem value="partial">Contains</SelectItem>
                <SelectItem value="wildcard">Wildcard (*)</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Add notes about this word filter"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingWord(null);
              setIsAddDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)}>
            {word ? "Update" : "Add"} Word
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Banned Words Management</h3>
        <div className="flex gap-2">
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Test Content
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test Content Against Banned Words</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="Enter content to test"
                  rows={4}
                />
                <Button
                  onClick={() => testContentMutation.mutate(testContent)}
                  disabled={
                    !testContent.trim() || testContentMutation.isPending
                  }
                >
                  Test Content
                </Button>

                {testResult && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Result:</span>
                      {testResult.is_blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : testResult.replacements_count > 0 ? (
                        <Badge variant="secondary">Words Replaced</Badge>
                      ) : (
                        <Badge variant="outline">Clean</Badge>
                      )}
                    </div>

                    {!testResult.is_blocked &&
                      testResult.processed_content !== testContent && (
                        <div>
                          <p className="text-sm font-medium mb-2">
                            Processed Content:
                          </p>
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm">
                              {testResult.processed_content}
                            </p>
                          </div>
                        </div>
                      )}

                    {testResult.replacements_made &&
                      testResult.replacements_made.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Replacements made:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {testResult.replacements_made.map(
                              (replacement: any, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {replacement.pattern} →{" "}
                                  {replacement.replacement}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {testResult.is_blocked && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Content blocked due to banned words with "ban"
                          severity.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Word
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Banned Word</DialogTitle>
              </DialogHeader>
              <WordForm onSave={(data) => wordMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="profanity">Profanity</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="harassment">Harassment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div>Loading banned words...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word/Pattern</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Match Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWords?.map((word) => (
                <TableRow key={word.id}>
                  <TableCell className="font-mono">
                    {word.word_pattern}
                  </TableCell>
                  <TableCell>{getActionBadge(word.action)}</TableCell>
                  <TableCell>{getSeverityBadge(word.severity)}</TableCell>
                  <TableCell>{getCategoryBadge(word.category)}</TableCell>
                  <TableCell className="capitalize">
                    {word.match_type}
                  </TableCell>
                  <TableCell>
                    {word.is_active ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingWord(word)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(word.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {editingWord && (
        <Dialog open={!!editingWord} onOpenChange={() => setEditingWord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Banned Word</DialogTitle>
            </DialogHeader>
            <WordForm
              word={editingWord}
              onSave={(data) =>
                wordMutation.mutate({ ...data, id: editingWord.id })
              }
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
