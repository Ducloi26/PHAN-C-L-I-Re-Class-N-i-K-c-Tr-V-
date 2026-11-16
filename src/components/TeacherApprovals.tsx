import React, { useCallback, useEffect, useState } from 'react';
import { fetchTeacherApplications, reviewTeacherApplication, TeacherApplication } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';

const STATUS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Đã từ chối', revoked: 'Đã thu hồi' };

export function TeacherApprovals() {
  const [accounts, setAccounts] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setAccounts(await fetchTeacherApplications()); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không tải được tài khoản.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    refresh();
    return multiplayerSocket.on('teachers:updated', refresh);
  }, [refresh]);
  async function review(id: string, status: 'approved' | 'rejected' | 'revoked') {
    setBusyId(id);
    try { await reviewTeacherApplication(id, status); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không duyệt được tài khoản.'); }
    finally { setBusyId(''); }
  }
  const pendingCount = accounts.filter((account) => account.status === 'pending').length;
  return <section className="bg-white border border-amber-300/80 rounded-2xl p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div><h2 className="text-lg font-bold text-emerald-950">Duyệt tài khoản giáo viên ({pendingCount} chờ duyệt)</h2>
        <p className="text-sm text-gray-500 mt-1">Giáo viên được duyệt mới có quyền giảng dạy và xuất hiện trong danh sách nhận hoa.</p></div>
      <button onClick={refresh} disabled={loading} className="border px-3 py-2 rounded-lg text-sm disabled:opacity-50">Tải lại danh sách</button>
    </div>
    {error && <p role="alert" className="mb-3 p-3 bg-rose-50 text-rose-800 rounded-lg text-sm">{error}</p>}
    {loading ? <p role="status" className="text-sm text-gray-500">Đang tải tài khoản...</p>
      : accounts.length === 0 && !error ? <p className="text-sm text-gray-500">Chưa có đăng ký giáo viên nào. Giáo viên có thể đăng ký tại trang Đăng nhập.</p>
      : <div className="space-y-3">{[...accounts].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending')).map((account) => <div key={account.id} className="border rounded-xl p-4 flex flex-wrap justify-between gap-3">
        <div><p className="font-semibold text-gray-900">{account.display_name}</p><p className="text-sm text-gray-600">{account.email}</p><p className="text-sm text-gray-500">{account.title}</p>
          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${account.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{STATUS[account.status]}</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {account.status !== 'approved' && <button disabled={Boolean(busyId)} onClick={() => review(account.id, 'approved')} className="px-3 py-2 rounded-lg bg-emerald-800 text-white text-sm disabled:opacity-50">Duyệt giáo viên</button>}
          {account.status === 'pending' && <button disabled={Boolean(busyId)} onClick={() => review(account.id, 'rejected')} className="px-3 py-2 rounded-lg border border-rose-300 text-rose-800 text-sm disabled:opacity-50">Từ chối</button>}
          {account.status === 'approved' && <button disabled={Boolean(busyId)} onClick={() => review(account.id, 'revoked')} className="px-3 py-2 rounded-lg border border-rose-300 text-rose-800 text-sm disabled:opacity-50">Thu hồi quyền</button>}
          {busyId === account.id && <span className="text-xs text-gray-500">Đang cập nhật...</span>}
        </div>
      </div>)}</div>}
  </section>;
}
