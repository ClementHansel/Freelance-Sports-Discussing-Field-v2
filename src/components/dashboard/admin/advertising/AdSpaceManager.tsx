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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Monitor, Smartphone, Globe } from "lucide-react";
import { useAdSpaces, type AdSpace } from "@/hooks/useAdSpaces";
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

const AD_LOCATIONS = [
  { value: "header", label: "Header Banner" },
  { value: "sidebar", label: "Sidebar" },
  { value: "between_posts", label: "Between Posts" },
  { value: "footer", label: "Footer" },
  { value: "topic_list", label: "Topic List" },
  { value: "category_page", label: "Category Page" },
];

const DEVICE_OPTIONS = [
  { value: "both", label: "Both", icon: Globe },
  { value: "desktop", label: "Desktop Only", icon: Monitor },
  { value: "mobile", label: "Mobile Only", icon: Smartphone },
];

interface AdSpaceFormData {
  name: string;
  description: string;
  location: string;
  device_targeting: "desktop" | "mobile" | "both";
  ad_code: string;
  display_order: number;
  is_active: boolean;
}

export const AdSpaceManager = () => {
  const { adSpaces, isLoading, createAdSpace, updateAdSpace, deleteAdSpace } =
    useAdSpaces();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdSpace, setEditingAdSpace] = useState<AdSpace | null>(null);
  const [formData, setFormData] = useState<AdSpaceFormData>({
    name: "",
    description: "",
    location: "",
    device_targeting: "both",
    ad_code: "",
    display_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      device_targeting: "both",
      ad_code: "",
      display_order: 0,
      is_active: true,
    });
    setEditingAdSpace(null);
  };

  const handleEdit = (adSpace: AdSpace) => {
    setFormData({
      name: adSpace.name,
      description: adSpace.description || "",
      location: adSpace.location,
      device_targeting: adSpace.device_targeting,
      ad_code: adSpace.ad_code || "",
      display_order: adSpace.display_order,
      is_active: adSpace.is_active,
    });
    setEditingAdSpace(adSpace);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🚀 Attempting to submit ad space:", formData);

    try {
      if (editingAdSpace) {
        console.log("📝 Updating existing ad space:", editingAdSpace.id);
        await updateAdSpace.mutateAsync({ id: editingAdSpace.id, ...formData });
        console.log("✅ Ad space updated successfully");
      } else {
        console.log("➕ Creating new ad space");
        const result = await createAdSpace.mutateAsync(formData);
        console.log("✅ Ad space created successfully:", result);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("❌ Failed to submit ad space:", error);
      // Error is already handled by the mutation's onError callback
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAdSpace.mutateAsync(id);
  };

  const getDeviceIcon = (device: string) => {
    const option = DEVICE_OPTIONS.find((opt) => opt.value === device);
    return option?.icon || Globe;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ad Spaces</h2>
          <p className="text-muted-foreground">
            Manage your advertising placements
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Ad Space
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAdSpace ? "Edit Ad Space" : "Create Ad Space"}
              </DialogTitle>
              <DialogDescription>
                {editingAdSpace
                  ? "Update the ad space settings"
                  : "Create a new advertising placement"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Header Banner"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, location: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_LOCATIONS.map((location) => (
                        <SelectItem key={location.value} value={location.value}>
                          {location.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="device_targeting">Device Targeting</Label>
                  <Select
                    value={formData.device_targeting}
                    onValueChange={(value: "desktop" | "mobile" | "both") =>
                      setFormData((prev) => ({
                        ...prev,
                        device_targeting: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ad_code">Ad Code</Label>
                <Textarea
                  id="ad_code"
                  value={formData.ad_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ad_code: e.target.value,
                    }))
                  }
                  placeholder="Paste your advertising code here (HTML/JavaScript)"
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAdSpace.isPending || updateAdSpace.isPending}
                >
                  {editingAdSpace ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {adSpaces.map((adSpace) => {
          const DeviceIcon = getDeviceIcon(adSpace.device_targeting);
          return (
            <Card key={adSpace.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {adSpace.name}
                      <Badge
                        variant={adSpace.is_active ? "default" : "secondary"}
                      >
                        {adSpace.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    {adSpace.description && (
                      <CardDescription>{adSpace.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(adSpace)}
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
                          <AlertDialogTitle>Delete Ad Space</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{adSpace.name}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(adSpace.id)}
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DeviceIcon className="h-4 w-4" />
                    {
                      DEVICE_OPTIONS.find(
                        (opt) => opt.value === adSpace.device_targeting
                      )?.label
                    }
                  </div>
                  <div>
                    Location:{" "}
                    {
                      AD_LOCATIONS.find((loc) => loc.value === adSpace.location)
                        ?.label
                    }
                  </div>
                  <div>Order: {adSpace.display_order}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {adSpaces.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No ad spaces created yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first ad space to start managing advertisements.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
