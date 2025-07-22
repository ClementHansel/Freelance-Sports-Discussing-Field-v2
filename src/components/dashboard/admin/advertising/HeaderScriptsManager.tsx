"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Code } from "lucide-react";
import { useForumSettings } from "@/hooks/useForumSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HeaderScript {
  id: string;
  name: string;
  description?: string;
  script: string;
  is_active: boolean;
}

export const HeaderScriptsManager = () => {
  const { getSetting, updateSetting } = useForumSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<HeaderScript | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    script: "",
    is_active: true,
  });

  // Get current header scripts from settings with safe parsing
  const getHeaderScripts = (): HeaderScript[] => {
    try {
      const rawSetting = getSetting("header_scripts", "[]");

      // If it's already an array (parsed), return it
      if (Array.isArray(rawSetting)) {
        return rawSetting;
      }

      // If it's a string, try to parse it
      if (typeof rawSetting === "string") {
        if (
          rawSetting === "" ||
          rawSetting === "null" ||
          rawSetting === "undefined"
        ) {
          return [];
        }
        return JSON.parse(rawSetting);
      }

      // Fallback to empty array
      return [];
    } catch (error) {
      console.error("Error parsing header scripts:", error);
      return [];
    }
  };

  const headerScripts: HeaderScript[] = getHeaderScripts();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      script: "",
      is_active: true,
    });
    setEditingScript(null);
  };

  const handleEdit = (script: HeaderScript) => {
    setFormData({
      name: script.name,
      description: script.description || "",
      script: script.script,
      is_active: script.is_active,
    });
    setEditingScript(script);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedScripts = [...headerScripts];

    if (editingScript) {
      // Update existing script
      const index = updatedScripts.findIndex((s) => s.id === editingScript.id);
      if (index !== -1) {
        updatedScripts[index] = { ...editingScript, ...formData };
      }
    } else {
      // Add new script
      const newScript: HeaderScript = {
        id: Date.now().toString(),
        ...formData,
      };
      updatedScripts.push(newScript);
    }

    await updateSetting({
      key: "header_scripts",
      value: JSON.stringify(updatedScripts),
      type: "json",
      category: "advertising",
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const updatedScripts = headerScripts.filter((script) => script.id !== id);
    await updateSetting({
      key: "header_scripts",
      value: JSON.stringify(updatedScripts),
      type: "json",
      category: "advertising",
    });
  };

  const handleToggleActive = async (id: string) => {
    const updatedScripts = headerScripts.map((script) =>
      script.id === id ? { ...script, is_active: !script.is_active } : script
    );
    await updateSetting({
      key: "header_scripts",
      value: JSON.stringify(updatedScripts),
      type: "json",
      category: "advertising",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Header Scripts</h2>
          <p className="text-muted-foreground">
            Manage scripts that are injected into the page header
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingScript ? "Edit Header Script" : "Add Header Script"}
              </DialogTitle>
              <DialogDescription>
                {editingScript
                  ? "Update the header script"
                  : "Add a new script to be injected into the page header"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Script Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Google AdSense"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Optional description"
                />
              </div>

              <div>
                <Label htmlFor="script">Script Code</Label>
                <Textarea
                  id="script"
                  value={formData.script}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, script: e.target.value }))
                  }
                  placeholder="Paste your script code here (HTML/JavaScript)"
                  rows={8}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Include the full script tags and any HTML needed.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingScript ? "Update" : "Add"} Script
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {headerScripts.map((script) => (
          <Card key={script.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    {script.name}
                    <Badge variant={script.is_active ? "default" : "secondary"}>
                      {script.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  {script.description && (
                    <CardDescription>{script.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(script.id)}
                  >
                    {script.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(script)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Header Script
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{script.name}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(script.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {script.script.substring(0, 200)}
                  {script.script.length > 200 && "..."}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}

        {headerScripts.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No header scripts configured yet.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add scripts for advertising networks, analytics, or other
                services.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
