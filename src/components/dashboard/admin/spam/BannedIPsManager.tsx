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
import { Plus, Edit, Trash2, Shield, ShieldCheck } from "lucide-react";

interface BannedIP {
  id: string;
  ip_address: string;
  ip_range?: string;
  ban_type: "temporary" | "permanent" | "shadowban";
  reason: string;
  expires_at?: string;
  is_active: boolean;
  admin_notes?: string;
  // Make appeal_status optional in the interface itself
  appeal_status?: "none" | "pending" | "approved" | "denied";
  created_at: string;
}

interface IPWhitelist {
  id: string;
  ip_address: string;
  ip_range?: string;
  description: string;
  bypass_level: "basic" | "moderate" | "full";
  is_active: boolean;
  created_at: string;
}

export const BannedIPsManager = () => {
  const [selectedTab, setSelectedTab] = useState<"banned" | "whitelist">(
    "banned"
  );
  const [selectedBanType, setSelectedBanType] = useState<string>("all");
  const [editingIP, setEditingIP] = useState<BannedIP | null>(null);
  const [editingWhitelist, setEditingWhitelist] = useState<IPWhitelist | null>(
    null
  );
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isWhitelistDialogOpen, setIsWhitelistDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch banned IPs
  const { data: bannedIPs, isLoading: bannedLoading } = useQuery<BannedIP[]>({
    // Explicitly type the data
    queryKey: ["banned-ips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_ips")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BannedIP[];
    },
  });

  // Fetch whitelisted IPs
  const { data: whitelistIPs, isLoading: whitelistLoading } = useQuery<
    IPWhitelist[]
  >({
    // Explicitly type the data
    queryKey: ["whitelist-ips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ip_whitelist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IPWhitelist[];
    },
  });

  // Ban IP mutation
  const banMutation = useMutation({
    mutationFn: async (
      ipData: Partial<BannedIP> & { ip_address: string; reason: string }
    ) => {
      // Clean up the data - convert empty strings to null for timestamp fields
      const cleanedData = {
        ...ipData,
        expires_at: ipData.expires_at === "" ? null : ipData.expires_at,
      };

      if (ipData.id) {
        const { error } = await supabase
          .from("banned_ips")
          .update(cleanedData)
          .eq("id", ipData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banned_ips").insert(cleanedData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-ips"] });
      toast({ title: "IP ban updated successfully" });
      setEditingIP(null);
      setIsBanDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating IP ban:", error);
      toast({ title: "Failed to update IP ban", variant: "destructive" });
    },
  });

  // Whitelist IP mutation
  const whitelistMutation = useMutation({
    mutationFn: async (
      ipData: Partial<IPWhitelist> & { ip_address: string; description: string }
    ) => {
      if (ipData.id) {
        const { error } = await supabase
          .from("ip_whitelist")
          .update(ipData)
          .eq("id", ipData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ip_whitelist").insert(ipData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelist-ips"] });
      toast({ title: "IP whitelist updated successfully" });
      setEditingWhitelist(null);
      setIsWhitelistDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating IP whitelist:", error);
      toast({ title: "Failed to update IP whitelist", variant: "destructive" });
    },
  });

  // Delete mutations
  const deleteBanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banned_ips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-ips"] });
      toast({ title: "IP ban removed successfully" });
    },
  });

  const deleteWhitelistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ip_whitelist")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelist-ips"] });
      toast({ title: "IP whitelist entry removed successfully" });
    },
  });

  const getBanTypeBadge = (banType: string, expiresAt?: string) => {
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    if (isExpired) {
      return <Badge variant="outline">Expired</Badge>;
    }

    switch (banType) {
      case "permanent":
        return <Badge variant="destructive">Permanent</Badge>;
      case "temporary":
        return <Badge variant="secondary">Temporary</Badge>;
      case "shadowban":
        return <Badge variant="outline">Shadow Ban</Badge>;
      default:
        return <Badge variant="outline">{banType}</Badge>;
    }
  };

  const getBypassLevelBadge = (level: string) => {
    switch (level) {
      case "full":
        return <Badge variant="destructive">Full Bypass</Badge>;
      case "moderate":
        return <Badge variant="secondary">Moderate Bypass</Badge>;
      case "basic":
        return <Badge variant="outline">Basic Bypass</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const filteredBannedIPs = bannedIPs?.filter(
    (ip) => selectedBanType === "all" || ip.ban_type === selectedBanType
  );

  const BanForm = ({
    ip,
    onSave,
  }: {
    ip?: BannedIP;
    // Type 'data' to match the formData's structure, now with appeal_status being optional
    onSave: (data: Omit<BannedIP, "id" | "created_at">) => void;
  }) => {
    // Ensure formData matches the type expected by onSave
    const [formData, setFormData] = useState<
      Omit<BannedIP, "id" | "created_at">
    >({
      ip_address: ip?.ip_address || "",
      ban_type: ip?.ban_type || "temporary",
      reason: ip?.reason || "",
      expires_at: ip?.expires_at || "",
      is_active: ip?.is_active ?? true,
      admin_notes: ip?.admin_notes || "",
      // Initialize appeal_status as it's part of the Omit type, even if optional
      appeal_status: ip?.appeal_status || "none",
    });

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="ip_address">IP Address</Label>
          <Input
            id="ip_address"
            value={formData.ip_address}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, ip_address: e.target.value }))
            }
            placeholder="e.g., 192.168.1.1 or 192.168.1.0/24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ban_type">Ban Type</Label>
            <Select
              value={formData.ban_type}
              onValueChange={(value) =>
                // Assert the value to the specific union type
                setFormData((prev) => ({
                  ...prev,
                  ban_type: value as BannedIP["ban_type"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="shadowban">Shadow Ban</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.ban_type === "temporary" && (
            <div>
              <Label htmlFor="expires_at">Expires At</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expires_at: e.target.value,
                  }))
                }
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            value={formData.reason}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Reason for banning this IP"
          />
        </div>

        <div>
          <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
          <Textarea
            id="admin_notes"
            value={formData.admin_notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, admin_notes: e.target.value }))
            }
            placeholder="Internal notes about this ban"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingIP(null);
              setIsBanDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)}>
            {ip ? "Update" : "Ban"} IP
          </Button>
        </div>
      </div>
    );
  };

  const WhitelistForm = ({
    ip,
    onSave,
  }: {
    ip?: IPWhitelist;
    // Type 'data' to match the formData's structure
    onSave: (data: Omit<IPWhitelist, "id" | "created_at">) => void;
  }) => {
    const [formData, setFormData] = useState<
      Omit<IPWhitelist, "id" | "created_at">
    >({
      ip_address: ip?.ip_address || "",
      description: ip?.description || "",
      bypass_level: ip?.bypass_level || "basic",
      is_active: ip?.is_active ?? true,
    });

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="ip_address">IP Address</Label>
          <Input
            id="ip_address"
            value={formData.ip_address}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, ip_address: e.target.value }))
            }
            placeholder="e.g., 192.168.1.1 or 192.168.1.0/24"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Description of this trusted IP"
          />
        </div>

        <div>
          <Label htmlFor="bypass_level">Bypass Level</Label>
          <Select
            value={formData.bypass_level}
            onValueChange={(value) =>
              // Assert the value to the specific union type
              setFormData((prev) => ({
                ...prev,
                bypass_level: value as IPWhitelist["bypass_level"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic - Rate limits only</SelectItem>
              <SelectItem value="moderate">Moderate - Most filters</SelectItem>
              <SelectItem value="full">Full - All restrictions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingWhitelist(null);
              setIsWhitelistDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)}>
            {ip ? "Update" : "Add"} Whitelist
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">IP Management</h3>
        <div className="flex gap-2">
          <Button
            variant={selectedTab === "banned" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTab("banned")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Banned IPs
          </Button>
          <Button
            variant={selectedTab === "whitelist" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTab("whitelist")}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Whitelist
          </Button>
        </div>
      </div>

      {selectedTab === "banned" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={selectedBanType} onValueChange={setSelectedBanType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ban Types</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="shadowban">Shadow Ban</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ban IP
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ban IP Address</DialogTitle>
                </DialogHeader>
                <BanForm onSave={(data) => banMutation.mutate(data)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-6">
            {bannedLoading ? (
              <div>Loading banned IPs...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Ban Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBannedIPs?.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono">
                        {ip.ip_address}
                      </TableCell>
                      <TableCell>
                        {getBanTypeBadge(ip.ban_type, ip.expires_at)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ip.reason}
                      </TableCell>
                      <TableCell>
                        {ip.expires_at
                          ? new Date(ip.expires_at).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {ip.is_active ? (
                          <Badge variant="destructive">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingIP(ip)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBanMutation.mutate(ip.id)}
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
        </div>
      )}

      {selectedTab === "whitelist" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={isWhitelistDialogOpen}
              onOpenChange={setIsWhitelistDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Whitelist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add IP to Whitelist</DialogTitle>
                </DialogHeader>
                <WhitelistForm
                  onSave={(data) => whitelistMutation.mutate(data)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-6">
            {whitelistLoading ? (
              <div>Loading whitelisted IPs...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Bypass Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whitelistIPs?.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono">
                        {ip.ip_address}
                      </TableCell>
                      <TableCell>{ip.description}</TableCell>
                      <TableCell>
                        {getBypassLevelBadge(ip.bypass_level)}
                      </TableCell>
                      <TableCell>
                        {ip.is_active ? (
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
                            onClick={() => setEditingWhitelist(ip)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              deleteWhitelistMutation.mutate(ip.id)
                            }
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
        </div>
      )}

      {/* Edit Dialogs */}
      {editingIP && (
        <Dialog open={!!editingIP} onOpenChange={() => setEditingIP(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit IP Ban</DialogTitle>
            </DialogHeader>
            <BanForm
              ip={editingIP}
              onSave={(data) =>
                banMutation.mutate({ ...data, id: editingIP.id })
              }
            />
          </DialogContent>
        </Dialog>
      )}

      {editingWhitelist && (
        <Dialog
          open={!!editingWhitelist}
          onOpenChange={() => setEditingWhitelist(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit IP Whitelist</DialogTitle>
            </DialogHeader>
            <WhitelistForm
              ip={editingWhitelist}
              onSave={(data) =>
                whitelistMutation.mutate({ ...data, id: editingWhitelist.id })
              }
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
