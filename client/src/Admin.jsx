import React, { useCallback, useEffect, useState } from 'react';
import { Trash2, Loader2, Inbox } from 'lucide-react';
const STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
const APPS = ['Washing Machine', 'Air Conditioner', 'Refrigerator', 'Microwave Oven', 'Television', 'Water Purifier', 'Other'];

export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem('sai_token') || ''), [cred, setCred] = useState({ username: '', password: '' }), [msg, setMsg] = useState('');
  const [data, setData] = useState(null), [f, setF] = useState({ q: '', appliance: '', date: '' }), [sel, setSel] = useState(null), [load, setLoad] = useState(false);
  const logout = () => { sessionStorage.removeItem('sai_token'); setToken(''); setData(null); };
  const api = useCallback(async (url, opt = {}) => { const r = await fetch(url, { ...opt, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    if (r.status === 401 && token) { logout(); throw new Error('Session expired'); } const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }, [token]);
  const refresh = useCallback(() => { if (!token) return; setLoad(true); api('/api/bookings?' + new URLSearchParams(f)).then(setData).catch(e => setMsg(e.message)).finally(() => setLoad(false)); }, [token, f, api]);
  useEffect(() => { const t = setTimeout(refresh, 250); return () => clearTimeout(t); }, [refresh]);

  const login = async e => { e.preventDefault(); setMsg(''); try { const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cred) }); const j = await r.json(); if (!r.ok) throw new Error(j.error);
    sessionStorage.setItem('sai_token', j.token); setToken(j.token); } catch (e) { setMsg(e.message); } };
  const status = async (b, s) => { await api(`/api/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ status: s }) }); setSel(x => x && x.id === b.id ? { ...x, status: s } : x); refresh(); };
  const del = async b => { if (confirm(`Delete booking #${b.id}?`)) { await api(`/api/bookings/${b.id}`, { method: 'DELETE' }); setSel(null); refresh(); } };

  if (!token) return <div className="min-h-screen grid place-items-center bg-brand-50 p-4"><form onSubmit={login} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm space-y-4">
    <h1 className="text-2xl font-bold">SDKR Admin</h1><input className="input" placeholder="Username" value={cred.username} onChange={e => setCred({ ...cred, username: e.target.value })} />
    <input className="input" type="password" placeholder="Password" value={cred.password} onChange={e => setCred({ ...cred, password: e.target.value })} />
    {msg && <p className="text-sm text-red-600">{msg}</p>}<button className="btn-p w-full">Sign in</button></form></div>;

  const s = data?.stats || {};
  return <div className="max-w-6xl mx-auto p-4">
    <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">SDKR Bookings</h1><div className="flex gap-2"><a href="#" className="btn-o !py-1.5">Site</a><button onClick={logout} className="btn-o !py-1.5">Logout</button></div></div>
    <div className="grid grid-cols-3 gap-4 mb-6">{[['Total', s.total], ['Pending', s.pending], ['Completed', s.completed]].map(([l, v]) => <div key={l} className="rounded-2xl border p-4 shadow-sm"><p className="text-sm text-gray-500">{l}</p><p className="text-3xl font-bold text-brand-600">{v ?? '–'}</p></div>)}</div>
    <div className="grid sm:grid-cols-3 gap-3 mb-4"><input className="input" placeholder="Search name or mobile" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
      <select className="input" value={f.appliance} onChange={e => setF({ ...f, appliance: e.target.value })}><option value="">All appliances</option>{APPS.map(a => <option key={a}>{a}</option>)}</select>
      <input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
    {msg && <p className="text-red-600 text-sm mb-2">{msg}</p>}
    {load && !data ? <Loader2 className="animate-spin mx-auto" /> : !data?.bookings.length ? <div className="text-center py-16 text-gray-500"><Inbox className="mx-auto mb-2" />No bookings found</div> :
      <div className="overflow-x-auto rounded-2xl border"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr>{['#', 'Customer', 'Mobile', 'Appliance', 'Date', 'Status', ''].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{data.bookings.map(b => <tr key={b.id} className="border-t hover:bg-brand-50/50 cursor-pointer" onClick={() => setSel(b)}><td className="p-3">{b.id}</td><td className="p-3 font-medium">{b.name}</td><td className="p-3">{b.mobile}</td><td className="p-3">{b.appliance}</td><td className="p-3">{b.date}<br /><span className="text-xs text-gray-500">{b.time}</span></td>
          <td className="p-3" onClick={e => e.stopPropagation()}><select className="input !py-1" value={b.status} onChange={e => status(b, e.target.value)}>{STATUSES.map(x => <option key={x}>{x}</option>)}</select></td>
          <td className="p-3" onClick={e => e.stopPropagation()}><button aria-label="Delete" onClick={() => del(b)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button></td></tr>)}</tbody></table></div>}
    {sel && <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setSel(null)}><div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-1 text-sm" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-bold mb-2">Booking #{sel.id}</h2>{[['Name', 'name'], ['Mobile', 'mobile'], ['Appliance', 'appliance'], ['Problem', 'problem'], ['Description', 'description'], ['Address', 'address'], ['Date', 'date'], ['Time', 'time'], ['Notes', 'notes'], ['Status', 'status'], ['Created', 'created_at']].map(([l, k]) => <p key={k}><b>{l}:</b> {sel[k] || '-'}</p>)}
      <button className="btn-p w-full mt-4" onClick={() => setSel(null)}>Close</button></div></div>}
  </div>;
}
