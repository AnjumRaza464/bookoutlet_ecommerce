import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPKR } from "@/lib/money";
import { AdminHeader, Panel, adminBtn, adminBtnOutline, adminInput } from "@/components/admin/ui";
import { UserControls } from "./user-controls";

export const metadata = { title: "Customers" };

const PER_PAGE = 30;
type Props = { searchParams: Promise<{ q?: string; role?: string; page?: string }> };

export default async function CustomersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = {};
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { phone: { contains: sp.q } }];
  if (sp.role === "CUSTOMER" || sp.role === "STAFF" || sp.role === "ADMIN") where.role = sp.role;

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
    }),
  ]);
  const spend = await db.order.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, status: { not: "CANCELLED" } },
    _sum: { total: true },
  });
  const spendBy = new Map(spend.map((s) => [s.userId, s._sum.total ?? 0]));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const isAdmin = me?.role === "ADMIN";

  return (
    <>
      <AdminHeader title="Customers" description={`${total} accounts${isAdmin ? "" : " · role changes require an administrator"}`} />
      <Panel>
        <form action="/admin/customers" className="mb-4 flex flex-wrap gap-2">
          <input name="q" defaultValue={sp.q} placeholder="Name, email or phone" aria-label="Search customers" className={`${adminInput} min-w-56 flex-1`} />
          <select name="role" defaultValue={sp.role ?? ""} aria-label="Role" className={adminInput}>
            <option value="">All roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admins</option>
          </select>
          <button className={adminBtn}>Filter</button>
          <Link href="/admin/customers" className={adminBtnOutline}>Reset</Link>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Joined</th>
                <th className="pb-2">Orders</th>
                <th className="pb-2">Total spent</th>
                <th className="pb-2">Role / status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className={!u.isActive ? "text-muted-foreground" : undefined}>
                  <td className="py-2.5">
                    <span className="font-medium text-foreground">{u.name}</span>
                    <span className="block text-xs text-muted-foreground">{u.email} {u.phone && `· ${u.phone}`}</span>
                  </td>
                  <td className="py-2.5">{u.createdAt.toLocaleDateString("en-PK")}</td>
                  <td className="py-2.5">
                    {u._count.orders > 0 ? <Link href={`/admin/orders?q=${encodeURIComponent(u.email)}`} className="text-brand-brown hover:underline">{u._count.orders}</Link> : 0}
                  </td>
                  <td className="py-2.5 font-semibold">{formatPKR(spendBy.get(u.id) ?? 0)}</td>
                  <td className="py-2.5">
                    <UserControls user={{ id: u.id, role: u.role, isActive: u.isActive }} editable={isAdmin && u.id !== me?.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="mt-4 flex justify-end gap-2 text-sm">
            {page > 1 && <Link href={`/admin/customers?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.role ? { role: sp.role } : {}), page: String(page - 1) })}`} className={adminBtnOutline}>Previous</Link>}
            {page < pages && <Link href={`/admin/customers?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.role ? { role: sp.role } : {}), page: String(page + 1) })}`} className={adminBtnOutline}>Next</Link>}
          </div>
        )}
      </Panel>
    </>
  );
}
