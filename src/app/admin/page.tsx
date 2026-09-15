"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

const PAGE_SIZE = 20;

type PlanType = "free" | "paid";
type UserTab = PlanType | "expired";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  role: "USER" | "ADMIN";
  plan_type?: PlanType | null;
  app_access?: "site1" | "site2" | "both" | null;
  upgraded_at?: string | null;
};

type FreeUsersExpiration = {
  expiresAt: string | null;
  pendingCount: number;
};

function formatKoreanExpirationText(expiresAt: string | null, count: number) {
  if (!expiresAt) {
    return `${count}명이 만료 예약 대기 중입니다.`;
  }

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(expiresAt));
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${count}명이 ${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}에 만료됩니다.`;
}

function toDatetimeLocalValue(expiresAt: string | null) {
  if (!expiresAt) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(new Date(expiresAt)).replace(" ", "T");
}

export default function AdminPage() {
  const { profile, status } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activePlanTab, setActivePlanTab] = useState<UserTab>("paid");
  const [showExpiredTab, setShowExpiredTab] = useState(false);
  const [freeUsersExpiration, setFreeUsersExpiration] = useState<FreeUsersExpiration>({
    expiresAt: null,
    pendingCount: 0,
  });
  const [freeUsersExpirationInput, setFreeUsersExpirationInput] = useState("");
  const [savingExpiration, setSavingExpiration] = useState(false);

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
      void fetchFreeUsersExpiration();
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

  const fetchFreeUsersExpiration = async () => {
    try {
      const res = await fetch("/api/admin/free-users-expiration");
      const data = (await res.json()) as FreeUsersExpiration;

      if (res.ok) {
        setFreeUsersExpiration(data);
        setFreeUsersExpirationInput(toDatetimeLocalValue(data.expiresAt));
      }
    } catch (error) {
      console.error("Failed to fetch free users expiration", error);
    }
  };

  const saveFreeUsersExpiration = async () => {
    if (!freeUsersExpirationInput) {
      return;
    }

    setSavingExpiration(true);

    try {
      const res = await fetch("/api/admin/free-users-expiration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: new Date(freeUsersExpirationInput).toISOString(),
        }),
      });
      const data = (await res.json()) as FreeUsersExpiration;

      if (res.ok) {
        setFreeUsersExpiration(data);
        setFreeUsersExpirationInput(toDatetimeLocalValue(data.expiresAt));
        await fetchUsers();
      }
    } catch (error) {
      console.error("Failed to save free users expiration", error);
    } finally {
      setSavingExpiration(false);
    }
  };

  const updateUser = async (
    id: string,
    newStatus?: string,
    newRole?: string,
    newPlanType?: PlanType,
    newAppAccess?: AdminUser["app_access"],
  ) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          role: newRole,
          plan_type: newPlanType,
          app_access: newAppAccess,
        }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  const upgradeUserToPaid = async (id: string) => {
    const confirmed = window.confirm(
      "정말로 유료 유저로 변경하시겠습니까?\n현재 사용자는 유료 유저로 변경되며 유료탭으로 이동됩니다.",
    );

    if (!confirmed) {
      return;
    }

    await updateUser(id, undefined, undefined, "paid", "site1");
  };

  const toggleExpiredTab = () => {
    setShowExpiredTab((current) => {
      if (current && activePlanTab === "expired") {
        setActivePlanTab("paid");
      }

      return !current;
    });
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const usersByPlan = users.filter((user) => {
      const planType = user.plan_type ?? "paid";

      if (activePlanTab === "expired") {
        return planType === "free" && user.app_access === "site2" && user.status === "EXPIRED";
      }

      if (activePlanTab === "free") {
        return planType === "free" && user.status !== "EXPIRED";
      }

      return planType === "paid";
    });

    if (!query) {
      return usersByPlan;
    }

    return usersByPlan.filter((user) =>
      [
        user.name ?? "",
        user.email,
        user.status,
        user.role,
        user.plan_type ?? "paid",
        user.app_access ?? "site1",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [activePlanTab, searchQuery, users]);

  const freeUserCount = users.filter(
    (user) => (user.plan_type ?? "paid") === "free" && user.status !== "EXPIRED",
  ).length;
  const paidUserCount = users.filter((user) => (user.plan_type ?? "paid") === "paid").length;
  const expiredUserCount = users.filter(
    (user) =>
      (user.plan_type ?? "paid") === "free" &&
      user.app_access === "site2" &&
      user.status === "EXPIRED",
  ).length;

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activePlanTab, searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  if (loading || status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold text-[#000]">사용자 관리</h1>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActivePlanTab("paid")}
            className={`rounded px-4 py-2 text-sm font-medium transition ${activePlanTab === "paid"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            유료 사용자 ({paidUserCount})
          </button>
          <button
            type="button"
            onClick={() => setActivePlanTab("free")}
            className={`rounded px-4 py-2 text-sm font-medium transition ${activePlanTab === "free"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            무료 사이트 사용자 ({freeUserCount})
          </button>
          {showExpiredTab && (
            <button
              type="button"
              onClick={() => setActivePlanTab("expired")}
              className={`rounded px-4 py-2 text-sm font-medium transition ${activePlanTab === "expired"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              만료된 사용자 ({expiredUserCount})
            </button>
          )}
        </div>
        {activePlanTab === "free" && (
          <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              {formatKoreanExpirationText(
                freeUsersExpiration.expiresAt,
                freeUsersExpiration.pendingCount,
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={freeUsersExpirationInput}
                onChange={(event) => setFreeUsersExpirationInput(event.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-[#000] outline-none transition focus:border-gray-500"
              />
              <button
                type="button"
                onClick={saveFreeUsersExpiration}
                disabled={!freeUsersExpirationInput || savingExpiration}
                className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {savingExpiration ? "적용 중..." : "적용"}
              </button>
            </div>
          </div>
        )}
        <div className="mb-4">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="이름, 이메일, 상태, 권한 검색"
            className="w-full max-w-md rounded border border-gray-300 px-4 py-2 text-sm text-[#000] outline-none transition focus:border-gray-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] whitespace-nowrap text-left text-sm">
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
              {paginatedUsers.map((user) => (
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
                    {activePlanTab === "free" && (
                      <button
                        onClick={() => upgradeUserToPaid(user.id)}
                        className="rounded bg-blue-500 px-3 py-1 text-white transition hover:bg-blue-600"
                      >
                        유료전환
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              총 {filteredUsers.length}명 중 {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}명 표시
            </span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded bg-gray-500 px-3 py-1 text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                이전
              </button>
              <span className="text-[#000]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded bg-gray-500 px-3 py-1 text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={toggleExpiredTab}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            toggleExpiredTab();
          }
        }}
        className="fixed bottom-1 right-2 select-none text-xs text-gray-300"
      >
        .
      </span>
    </div>
  );
}
