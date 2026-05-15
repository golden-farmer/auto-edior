"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  role: "USER" | "ADMIN";
};

export default function AdminPage() {
  const { profile, status } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      if (profile?.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }

      void fetchUsers();
    }
  }, [profile?.role, router, status]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, newStatus?: string, newRole?: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, role: newRole }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  if (loading || status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold text-[#000]">사용자 관리</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b-2 border-gray-200 bg-gray-50 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">이름</th>
                <th className="px-6 py-4 font-semibold text-gray-600">이메일</th>
                <th className="px-6 py-4 font-semibold text-gray-600">가입일</th>
                <th className="px-6 py-4 font-semibold text-gray-600">상태</th>
                <th className="px-6 py-4 font-semibold text-gray-600">권한</th>
                <th className="px-6 py-4 font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 text-[#000]">
                  <td className="px-6 py-4">{user.name || "-"}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : user.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${user.role === "ADMIN"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="space-x-2 px-6 py-4">
                    {user.status !== "APPROVED" && (
                      <button
                        onClick={() => updateUser(user.id, "APPROVED")}
                        className="rounded bg-green-500 px-3 py-1 text-white transition hover:bg-green-600"
                      >
                        승인
                      </button>
                    )}
                    {user.status !== "REJECTED" && (
                      <button
                        onClick={() => updateUser(user.id, "REJECTED")}
                        className="rounded bg-red-500 px-3 py-1 text-white transition hover:bg-red-600"
                      >
                        거절
                      </button>
                    )}
                    <button
                      onClick={() =>
                        updateUser(
                          user.id,
                          undefined,
                          user.role === "ADMIN" ? "USER" : "ADMIN",
                        )
                      }
                      className="rounded bg-gray-500 px-3 py-1 text-white transition hover:bg-gray-600"
                    >
                      {user.role === "ADMIN" ? "권한 해제" : "관리자 부여"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    등록된 사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
