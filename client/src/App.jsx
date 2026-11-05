import React, { useState } from 'react';
import { Wrench, WashingMachine, Snowflake, Refrigerator, Microwave, Tv, Droplets, Phone, MessageCircle, Menu, X, CheckCircle2, Loader2, ShieldCheck, Home, IndianRupee, Headphones, CalendarCheck } from 'lucide-react';
const PHONE = '9010274491', WA = '919010274491';
const SERVICES = [
  ['Washing Machine', 'Washing Machine Repair', WashingMachine, 'Drum, drain, spin and motor faults fixed, plus full servicing.', ['Not spinning', 'Water not draining', 'Leakage', 'Noisy drum', 'Not starting']],
  ['Air Conditioner', 'AC Repair & Servicing', Snowflake, 'Gas refill, deep cleaning, cooling issues and installation support.', ['Not cooling', 'Water leakage', 'Gas refill', 'Noisy', 'Periodic service']],
  ['Refrigerator', 'Refrigerator Repair', Refrigerator, 'Cooling, compressor, thermostat and door-seal repairs.', ['Not cooling', 'Over-cooling', 'Water leakage', 'Noisy compressor']],
  ['Microwave Oven', 'Microwave Oven Repair', Microwave, 'Heating, turntable, panel and magnetron problems.', ['Not heating', 'Turntable stuck', 'Sparking', 'Panel not working']],
  ['Television', 'Television Repair', Tv, 'Display, sound, power and backlight repairs for all TV types.', ['No display', 'No sound', 'Not turning on', 'Lines on screen']],
  ['Water Purifier', 'Water Purifier Service', Droplets, 'Filter and membrane replacement, leakage and taste fixes.', ['Low flow', 'Bad taste', 'Leakage', 'Filter change', 'Not working']]];
const OTHER = ['Other'], TIMES = ['9 AM – 12 PM', '12 PM – 3 PM', '3 PM – 6 PM', '6 PM – 8 PM'];
const go = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
const empty = { name: '', mobile: '', appliance: '', problem: '', description: '', address: '', date: '', time: '', notes: '' };

// Declared at module level so its identity is stable across renders (declaring it inside App remounted every input on each keystroke).
const F = ({ k, err, label, children }) => <label className="block"><span className="text-sm font-medium">{label}</span>{children}{err[k] && <span className="text-sm text-red-600">{err[k]}</span>}</label>;

export default function App() {
  const [open, setOpen] = useState(false), [form, setForm] = useState(empty), [err, setErr] = useState({});
  const [busy, setBusy] = useState(false), [done, setDone] = useState(null), [apiErr, setApiErr] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v, ...(k === 'appliance' ? { problem: '' } : {}) })); setErr(e => ({ ...e, [k]: '' })); };
  const problems = [...(SERVICES.find(s => s[0] === form.appliance)?.[4] || []), 'Other'];
  const nav = (id, label) => <button key={id} onClick={() => { go(id); setOpen(false); }} className="hover:text-brand-600 transition">{label}</button>;

  const local = () => { const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your name';
    if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.appliance) e.appliance = 'Select an appliance';
    if (!form.problem) e.problem = 'Select a problem type';
    if (form.description.trim().length < 5) e.description = 'Describe the problem';
    if (form.address.trim().length < 8) e.address = 'Enter your full address';
    if (!form.date || form.date < today) e.date = 'Choose today or a future date';
    if (!form.time) e.time = 'Select a time'; return e; };

  const submit = async ev => { ev.preventDefault(); if (busy) return; setApiErr('');
    const e = local(); setErr(e); if (Object.keys(e).length) return;
    setBusy(true); const win = window.open('', '_blank'); // opened synchronously so popup blockers allow it
    try {
      const r = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await r.json();
      if (!r.ok) { win?.close(); if (j.fields) setErr(j.fields); setApiErr(j.error || 'Something went wrong'); return; }
      if (win) win.location = j.whatsappUrl; setDone(j);
    } catch { win?.close(); setApiErr('Network error. Please try again or call us.'); }
    finally { setBusy(false); } };

  const inp = (k, p = {}) => <input className="input mt-1" value={form[k]} onChange={e => set(k, e.target.value)} {...p} />;

  return <div>
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100"><div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="#" className="flex items-center gap-2 font-extrabold text-xl"><span className="bg-brand-600 text-white p-1.5 rounded-lg"><Wrench size={20} /></span>SDKR</a>
      <nav className="hidden md:flex gap-7 text-sm font-medium">{nav('home', 'Home')}{nav('services', 'Our Services')}{nav('about', 'About Us')}{nav('book', 'Book a Service')}{nav('contact', 'Contact')}</nav>
      <button onClick={() => go('book')} className="btn-p hidden md:inline-flex">Book Appointment</button>
      <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
      {open && <div className="md:hidden px-4 pb-4 flex flex-col gap-3 font-medium">{nav('home', 'Home')}{nav('services', 'Our Services')}{nav('about', 'About Us')}{nav('book', 'Book a Service')}{nav('contact', 'Contact')}<button onClick={() => { go('book'); setOpen(false); }} className="btn-p">Book Appointment</button></div>}
    </header>

    <section id="home" className="bg-gradient-to-b from-brand-50 to-white"><div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
      <div><p className="text-brand-600 font-semibold mb-3">Reliable Repairs. Better Living.</p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Expert Home Appliance Repair at Your Doorstep</h1>
        <p className="mt-5 text-gray-600 text-lg">Reliable, affordable and professional home appliance repair services. We bring your appliances back to life.</p>
        <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => go('book')} className="btn-p">Book a Service</button><button onClick={() => go('services')} className="btn-o">Explore Services</button></div></div>
      <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80 rounded-[2.5rem] bg-white shadow-2xl shadow-brand-600/10 grid place-items-center">
        <WashingMachine size={150} className="text-brand-600" strokeWidth={1.2} />
        <Wrench size={72} className="absolute -top-4 -right-4 text-brand-700 wob bg-white rounded-2xl p-3 shadow-lg" />
        <Snowflake size={44} className="absolute -bottom-3 -left-3 text-sky-500 bg-white rounded-xl p-2 shadow-lg" /></div></div></section>

    <section id="services" className="max-w-6xl mx-auto px-4 py-16"><h2 className="text-3xl font-bold text-center">Our Services</h2>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{SERVICES.map(([key, name, Icon, desc, probs]) => <div key={key} className="rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 grid place-items-center"><Icon /></div>
        <h3 className="mt-4 font-semibold text-lg">{name}</h3><p className="mt-1 text-gray-600 text-sm">{desc}</p>
        <p className="mt-2 text-xs text-gray-500">Common issues: {probs.join(', ')}</p>
        <div className="mt-5 flex gap-2"><button onClick={() => { set('appliance', key); go('book'); }} className="btn-p flex-1 !py-2 text-sm">Book Now</button>
          <button onClick={() => alert(`${name}\n\n${desc}\n\nCommon issues: ${probs.join(', ')}\n\nCall ${PHONE} for a quote.`)} className="btn-o flex-1 !py-2 text-sm">View Details</button></div></div>)}</div></section>

    <section id="about" className="bg-gray-50"><div className="max-w-6xl mx-auto px-4 py-16"><h2 className="text-3xl font-bold text-center">Why Choose SDKR?</h2>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">{[[ShieldCheck, 'Experienced technicians'], [Home, 'Convenient doorstep service'], [IndianRupee, 'Affordable pricing'], [Headphones, 'Reliable customer support'], [CalendarCheck, 'Easy appointment booking']].map(([I, t]) =>
        <div key={t} className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition"><I className="mx-auto text-brand-600" /><p className="mt-3 font-medium text-sm">{t}</p></div>)}</div></div></section>

    <section className="max-w-6xl mx-auto px-4 py-16"><h2 className="text-3xl font-bold text-center">How It Works</h2>
      <div className="mt-10 grid md:grid-cols-4 gap-6">{['Select your appliance', 'Describe the problem', 'Choose your preferred date and time', 'Submit your booking and receive confirmation'].map((t, i) =>
        <div key={t} className="relative rounded-2xl border border-gray-100 p-6"><span className="w-9 h-9 rounded-full bg-brand-600 text-white grid place-items-center font-bold">{i + 1}</span><p className="mt-3 font-medium">{t}</p></div>)}</div></section>

    <section id="book" className="bg-brand-50"><div className="max-w-3xl mx-auto px-4 py-16"><h2 className="text-3xl font-bold text-center">Book a Service</h2>
      {done ? <div className="mt-8 bg-white rounded-2xl p-8 text-center shadow-xl"><CheckCircle2 size={72} className="mx-auto text-green-500 pop" />
        <h3 className="mt-4 text-2xl font-bold">Booking received!</h3><p className="text-gray-600 mt-2">Booking #{done.booking.id} is saved. Please press <b>Send</b> in the WhatsApp message so we can confirm your appointment.</p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center"><a href={done.whatsappUrl} target="_blank" rel="noreferrer" className="btn-p"><MessageCircle size={18} />Open WhatsApp again</a><button className="btn-o" onClick={() => { setDone(null); setForm(empty); }}>New booking</button></div></div>
      : <form onSubmit={submit} noValidate className="mt-8 bg-white rounded-2xl p-6 md:p-8 shadow-xl grid sm:grid-cols-2 gap-4">
        <F err={err} k="name" label="Customer Name *">{inp('name', { autoComplete: 'name' })}</F>
        <F err={err} k="mobile" label="Mobile Number *">{inp('mobile', { inputMode: 'tel', maxLength: 14, autoComplete: 'tel' })}</F>
        <F err={err} k="appliance" label="Appliance Type *"><select className="input mt-1" value={form.appliance} onChange={e => set('appliance', e.target.value)}><option value="">Select…</option>{[...SERVICES.map(s => s[0]), ...OTHER].map(a => <option key={a}>{a}</option>)}</select></F>
        <F err={err} k="problem" label="Problem Type *"><select className="input mt-1" value={form.problem} onChange={e => set('problem', e.target.value)} disabled={!form.appliance}><option value="">Select…</option>{(form.appliance === 'Other' ? ['Other'] : problems).map(p => <option key={p}>{p}</option>)}</select></F>
        <div className="sm:col-span-2"><F err={err} k="description" label="Problem Description *"><textarea rows={3} className="input mt-1" value={form.description} onChange={e => set('description', e.target.value)} /></F></div>
        <div className="sm:col-span-2"><F err={err} k="address" label="Customer Address *"><textarea rows={2} className="input mt-1" value={form.address} onChange={e => set('address', e.target.value)} /></F></div>
        <F err={err} k="date" label="Preferred Date *">{inp('date', { type: 'date', min: today })}</F>
        <F err={err} k="time" label="Preferred Time *"><select className="input mt-1" value={form.time} onChange={e => set('time', e.target.value)}><option value="">Select…</option>{TIMES.map(t => <option key={t}>{t}</option>)}</select></F>
        <div className="sm:col-span-2"><F err={err} k="notes" label="Additional Notes (optional)">{inp('notes')}</F></div>
        {apiErr && <p className="sm:col-span-2 text-red-600 text-sm">{apiErr}</p>}
        <button disabled={busy} className="btn-p sm:col-span-2">{busy ? <><Loader2 className="animate-spin" size={18} />Submitting…</> : 'Book Appointment'}</button>
        <p className="sm:col-span-2 text-xs text-gray-500 text-center">Your booking is saved first, then WhatsApp opens with your details prefilled. Press Send there to confirm.</p></form>}</div></section>

    <section id="contact" className="max-w-6xl mx-auto px-4 py-16 text-center"><h2 className="text-3xl font-bold">Contact SDKR</h2>
      <p className="mt-3 text-gray-600">Phone: <a className="font-semibold text-brand-600" href={`tel:+91${PHONE}`}>{PHONE}</a> · Appointments by booking, 9 AM – 8 PM</p>
      <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="btn-p mt-6"><MessageCircle size={18} />Chat on WhatsApp</a></section>

    <footer className="bg-ink text-gray-300 py-8 text-center text-sm"><b className="text-white">SDKR</b> – Reliable Repairs. Better Living.<br />© {new Date().getFullYear()} SDKR Home Appliance Repair & Services</footer>
    <div className="fixed bottom-5 right-5 flex flex-col gap-3 z-50">
      <a href={`tel:+91${PHONE}`} aria-label="Call" className="w-12 h-12 rounded-full bg-brand-600 text-white grid place-items-center shadow-lg hover:scale-110 transition"><Phone size={20} /></a>
      <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-12 h-12 rounded-full bg-green-500 text-white grid place-items-center shadow-lg hover:scale-110 transition"><MessageCircle size={22} /></a></div>
  </div>;
}
