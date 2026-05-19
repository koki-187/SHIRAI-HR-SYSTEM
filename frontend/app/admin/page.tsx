'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
  history_count: number | string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated' && !(session?.user as any)?.isAdmin) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { if ((session?.user as any)?.isAdmin) loadUsers(); }, [session, loadUsers]);

  const toggleActive = async (userId: number, current: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, active: !current }),
    });
    setMsg(`ユーザーID ${userId} を${!current ? '有効化' : '無効化'}しました`);
    loadUsers();
  };

  const deleteUser = async (userId: number, email: string) => {
    if (!confirm(`${email} を完全に削除しますか？\n（履歴も全て削除されます）`)) return;
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setMsg(`${email} を削除しました`);
    loadUsers();
  };

  const exportCSV = () => {
    const header = ['ID', '氏名', 'メールアドレス', '登録日', '調査件数', 'ステータス'];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.email,
      new Date(u.created_at).toLocaleDateString('ja-JP'),
      u.history_count,
      u.active ? '有効' : '無効',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotelscope_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gray-900 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">🔐 HotelScope 管理者パネル</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition"
            >
              通常ダッシュボードへ
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm border border-gray-500 text-gray-300 hover:text-white px-4 py-1.5 rounded-lg transition"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            <p className="text-sm text-gray-500 mt-1">総ユーザー数</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{users.filter(u => u.active).length}</p>
            <p className="text-sm text-gray-500 mt-1">有効ユーザー</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {users.reduce((s, u) => s + Number(u.history_count), 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">総調査件数</p>
          </div>
        </div>

        {/* メッセージ */}
        {msg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            {msg}
            <button className="ml-3 text-green-500 hover:text-green-700" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {/* ユーザー一覧テーブル */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-800">会員情報一覧</h2>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSVエクスポート
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">氏名</th>
                  <th className="px-4 py-3 text-left">メールアドレス</th>
                  <th className="px-4 py-3 text-left">登録日</th>
                  <th className="px-4 py-3 text-center">調査件数</th>
                  <th className="px-4 py-3 text-center">ステータス</th>
                  <th className="px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${!user.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{user.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                        {user.history_count} 件
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {user.active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleActive(user.id, user.active)}
                          className={`text-xs px-3 py-1 rounded-lg border transition ${
                            user.active
                              ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                              : 'border-green-400 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {user.active ? '無効化' : '有効化'}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      登録ユーザーがいません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
