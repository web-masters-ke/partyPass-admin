"use client";

import { useState } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate, getInitials } from "@/lib/utils";
import { usersApi, unwrap } from "@/lib/api";
import type { User, UserRole, LoyaltyTier } from "@/lib/types";

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  onRefresh?: () => void;
}

function RoleBadge({ role }: { role: UserRole }) {
  const variantMap: Record<UserRole, "admin" | "organizer" | "attendee" | "default"> = {
    ADMIN: "admin",
    SUPER_ADMIN: "admin",
    ORGANIZER: "organizer",
    ATTENDEE: "attendee",
    GATE_STAFF: "default",
  };
  return <Badge variant={variantMap[role]}>{role.replace("_", " ")}</Badge>;
}

function TierBadge({ tier }: { tier: LoyaltyTier }) {
  const variantMap: Record<LoyaltyTier, "bronze" | "silver" | "gold" | "platinum" | "diamond"> = {
    BRONZE: "bronze",
    SILVER: "silver",
    GOLD: "gold",
    PLATINUM: "platinum",
    DIAMOND: "diamond",
  };
  return <Badge variant={variantMap[tier]}>{tier}</Badge>;
}

export function UsersTable({ users, loading, onRefresh }: UsersTableProps) {
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBanToggle = async () => {
    if (!confirmUser) return;
    setActionLoading(true);
    try {
      if (confirmUser.isActive) {
        await usersApi.ban(confirmUser.id);
      } else {
        await usersApi.unban(confirmUser.id);
      }
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setConfirmUser(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">No users found</div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">User</th>
              <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Email</th>
              <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Role</th>
              <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Tier</th>
              <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Joined</th>
              <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th className="pb-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D93B2F] text-sm font-bold text-white">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user.firstName} {user.lastName}
                      </p>
                      {user.phone && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.phone}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                <td className="py-3 pr-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="py-3 pr-4">
                  <TierBadge tier={user.loyaltyTier} />
                </td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="py-3 pr-4">
                  <Badge
                    variant={user.isActive ? "success" : "destructive"}
                  >
                    {user.isActive ? "Active" : "Banned"}
                  </Badge>
                </td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      user.isActive
                        ? "text-red-600 hover:text-red-700"
                        : "text-green-600 hover:text-green-700"
                    }
                    onClick={() => setConfirmUser(user)}
                  >
                    {user.isActive ? (
                      <>
                        <ShieldOff className="mr-1 h-4 w-4" />
                        Ban
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-1 h-4 w-4" />
                        Unban
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm modal */}
      <Dialog open={!!confirmUser} onOpenChange={() => setConfirmUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmUser?.isActive ? "Ban User" : "Unban User"}
            </DialogTitle>
            <DialogDescription>
              {confirmUser?.isActive
                ? `Are you sure you want to ban ${confirmUser?.firstName} ${confirmUser?.lastName}? They will lose access to all features.`
                : `Are you sure you want to unban ${confirmUser?.firstName} ${confirmUser?.lastName}? They will regain full access.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmUser?.isActive ? "destructive" : "default"}
              onClick={handleBanToggle}
              disabled={actionLoading}
            >
              {actionLoading
                ? "Processing..."
                : confirmUser?.isActive
                ? "Ban User"
                : "Unban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
