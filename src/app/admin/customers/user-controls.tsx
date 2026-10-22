"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import { adminInput } from "@/components/admin/ui";

export function UserControls({ user, editable }: { user: { id: string; role: string; isActive: boolean }; editable: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function patch(body: { role?: string; isActive?: boolean }) {
    setPending(true);
    try {
      await api(`/api/admin/users/${user.id}`, { method: "PATCH", body });
      toast.success("User updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update user");
    } finally {
      setPending(false);
    }
  }

  if (!editable) {
    return (
      <span className="text-xs font-semibold">
        {user.role} {!user.isActive && <span className="text-destructive">· disabled</span>}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <select aria-label="Role" value={user.role} disabled={pending} onChange={(e) => patch({ role: e.target.value })} className={`${adminInput} h-8`}>
        <option value="CUSTOMER">Customer</option>
        <option value="STAFF">Staff</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => patch({ isActive: !user.isActive })}
        className={`h-8 rounded-md border px-3 text-xs font-semibold ${user.isActive ? "border-input hover:bg-red-50 hover:text-destructive" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}
      >
        {user.isActive ? "Disable" : "Enable"}
      </button>
    </div>
  );
}
