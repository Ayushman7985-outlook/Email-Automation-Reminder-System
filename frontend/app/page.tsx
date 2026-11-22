'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
type Reminder = {id:string;name:string;email:string;subject:string;message:string;scheduled_at:string;recurrence:string;status:string};
type Contact = {id:string;name:string;email:string;department:string};
type Activity = {id:string;recipient:string;subject:string;status:string;detail:string;timestamp:string;mode:string};
type Dashboard = {contacts:number;reminders:number;scheduled:number;sent:number;simulated:number;failed:number;upcoming:Reminder[];recent_activity:Activity[]};

const chartData = [
 {day:'Mon',sent:18,scheduled:12},{day:'Tue',sent:25,scheduled:17},{day:'Wed',sent:21,scheduled:20},
 {day:'Thu',sent:34,scheduled:22},{day:'Fri',sent:29,scheduled:18},{day:'Sat',sent:39,scheduled:25},{day:'Sun',sent:44,scheduled:28}
];

export default function Home() {
 const [section,setSection]=useState('Overview');
 const [dashboard,setDashboard]=useState<Dashboard|null>(null);
 const [reminders,setReminders]=useState<Reminder[]>([]);
 const [contacts,setContacts]=useState<Contact[]>([]);
 const [activity,setActivity]=useState<Activity[]>([]);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [search,setSearch]=useState('');
 const [dryRun,setDryRun]=useState(true);
 const [reminderForm,setReminderForm]=useState({name:'',email:'',subject:'',message:'',scheduled_at:'',recurrence:'once'});
 const [contactForm,setContactForm]=useState({name:'',email:'',department:'General'});
 const [testForm,setTestForm]=useState({email:'',subject:'Quick test from PulseMail',message:'Hello! This is a test email from PulseMail.'});

 async function request(path:string, options:RequestInit={}) {
   const res=await fetch(`${API}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
   const data=await res.json().catch(()=>({}));
   if(!res.ok) throw new Error(data.detail||'Request failed');
   return data;
 }
 async function refresh() {
   try {
     const [d,r,c,a]=await Promise.all([request('/api/dashboard'),request('/api/reminders'),request('/api/contacts'),request('/api/activity')]);
     setDashboard(d);setReminders(r);setContacts(c);setActivity(a);
   } catch(e) { setNotice(`Backend connection issue: ${e instanceof Error?e.message:'Unknown error'}. Start the FastAPI server on port 8000.`); }
 }
 useEffect(()=>{refresh();const t=setInterval(refresh,15000);return()=>clearInterval(t)},[]);
 async function act(fn:()=>Promise<unknown>,success:string) {
   setBusy(true);setNotice('');
   try { await fn();setNotice(success);await refresh(); }
   catch(e){setNotice(e instanceof Error?e.message:'Something went wrong');}
   finally{setBusy(false);}
 }
 async function addReminder(e:React.FormEvent){e.preventDefault();await act(async()=>{await request('/api/reminders',{method:'POST',body:JSON.stringify({...reminderForm,scheduled_at:new Date(reminderForm.scheduled_at).toISOString()})});setReminderForm({name:'',email:'',subject:'',message:'',scheduled_at:'',recurrence:'once'});},'Reminder created successfully.');}
 async function addContact(e:React.FormEvent){e.preventDefault();await act(async()=>{await request('/api/contacts',{method:'POST',body:JSON.stringify(contactForm)});setContactForm({name:'',email:'',department:'General'});},'Contact added successfully.');}
 async function sendTest(e:React.FormEvent){e.preventDefault();await act(async()=>{await request('/api/send-test',{method:'POST',body:JSON.stringify({...testForm,dry_run:dryRun})});},dryRun?'Test simulated successfully — no email was sent.':'Email handed to SMTP server.');}
 async function runReminder(id:string){await act(async()=>{await request(`/api/reminders/${id}/run?dry_run=${dryRun}`,{method:'POST'});},dryRun?'Reminder simulated.':'Reminder submitted to SMTP.');}
 async function removeReminder(id:string){if(!confirm('Delete this reminder?'))return;await act(async()=>{await request(`/api/reminders/${id}`,{method:'DELETE'});},'Reminder deleted.');}
 async function removeContact(id:string){if(!confirm('Delete this contact?'))return;await act(async()=>{await request(`/api/contacts/${id}`,{method:'DELETE'});},'Contact deleted.');}

 const filtered=useMemo(()=>reminders.filter(r=>`${r.name} ${r.email} ${r.subject}`.toLowerCase().includes(search.toLowerCase())),[reminders,search]);
 const nav=[['Overview','◫'],['Reminders','◷'],['Contacts','♙'],['Email Studio','✉'],['Activity Logs','≋']];
 const title=section==='Overview'?'Your automation at a glance':section==='Email Studio'?'Compose and test an email':section==='Activity Logs'?'Every action, accounted for':`Manage your ${section.toLowerCase()}`;
 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand"><div className="brand-mark">✉</div><span className="brand-name">PulseMail</span></div>
   <div className="workspace-label">WORKSPACE</div>
   <nav className="nav">{nav.map(([label,icon])=><button key={label} className={section===label?'active':''} onClick={()=>setSection(label)}><span className="nav-icon">{icon}</span><span className="nav-text">{label}</span></button>)}</nav>
   <div className="side-bottom"><strong>✦ Smart workflow tip</strong><p>Start in simulation mode to preview emails before sending them to real recipients.</p><button onClick={()=>{setSection('Email Studio');setDryRun(true)}}>Open email studio ↗</button></div>
  </aside>
  <main className="main">
   <header className="topbar"><div className="crumb">Workspace&nbsp; / &nbsp;<b>{section}</b></div><div className="top-actions"><button className="icon-btn" title="Refresh" onClick={refresh}>↻</button><div className="avatar">AM</div></div></header>
   <div className="heading-row"><div><div className="eyebrow">EMAIL OPERATIONS PLATFORM</div><h1>{section==='Overview'?'Good evening, Admin':section}</h1><div className="sub">{title}</div></div><button className="primary" onClick={()=>setSection('Reminders')}>＋ Create reminder</button></div>
   {notice&&<div className="toast">{notice}</div>}
   {section==='Overview'&&<><section className="stats">
    <Stat label="Total contacts" value={dashboard?.contacts??'—'} icon="♙" tone="purple" foot="People in your workspace"/>
    <Stat label="Active reminders" value={dashboard?.scheduled??'—'} icon="◷" tone="orange" foot="Waiting to be triggered"/>
    <Stat label="Emails simulated" value={dashboard?.simulated??'—'} icon="✉" tone="green" foot="Safe test runs completed"/>
    <Stat label="Failed attempts" value={dashboard?.failed??'—'} icon="⚠" tone="red" foot="Review activity for details"/>
   </section>
   <div className="content-grid"><div>
    <section className="panel"><div className="panel-head"><div><div className="panel-title">Email performance</div><div className="panel-note">Illustrative weekly activity · sample chart</div></div><span className="pill scheduled">THIS WEEK</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#635bff" stopOpacity={.2}/><stop offset="100%" stopColor="#635bff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#eff1f6" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#929aaa'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#929aaa'}}/><Tooltip/><Area type="monotone" dataKey="sent" stroke="#635bff" strokeWidth={2.5} fill="url(#sentFill)"/><Area type="monotone" dataKey="scheduled" stroke="#aaa5ff" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div><div className="legend"><span>Emails processed</span><span>Scheduled reminders</span></div></section>
    <section className="panel"><div className="panel-head"><div><div className="panel-title">Upcoming reminders</div><div className="panel-note">Your next scheduled communications</div></div><button className="link-btn" onClick={()=>setSection('Reminders')}>View all →</button></div><ReminderTable items={(dashboard?.upcoming||[]).slice(0,5)} onRun={runReminder} onDelete={removeReminder}/></section>
   </div><div>
    <section className="panel"><div className="panel-head"><div><div className="panel-title">Recent activity</div><div className="panel-note">Latest email events</div></div><button className="link-btn" onClick={()=>setSection('Activity Logs')}>See all</button></div><ActivityList items={(dashboard?.recent_activity||[]).slice(0,6)}/></section>
    <section className="panel"><div className="panel-title">Quick actions</div><div className="panel-note" style={{marginBottom:14}}>Jump straight into your workflow</div><button className="secondary" style={{width:'100%',marginBottom:9}} onClick={()=>setSection('Email Studio')}>✉ &nbsp; Send a test email</button><button className="secondary" style={{width:'100%',marginBottom:9}} onClick={()=>setSection('Contacts')}>＋ &nbsp; Add a contact</button><button className="secondary" style={{width:'100%'}} onClick={()=>setSection('Reminders')}>◷ &nbsp; Schedule a reminder</button></section>
   </div></div></>}
   {section==='Reminders'&&<div className="page-grid"><section className="panel"><div className="panel-head"><div><div className="panel-title">Create a reminder</div><div className="panel-note">Personalized one-off or recurring email</div></div></div><form onSubmit={addReminder}><Field label="Reminder name"><input required value={reminderForm.name} onChange={e=>setReminderForm({...reminderForm,name:e.target.value})} placeholder="e.g. Weekly team sync"/></Field><Field label="Recipient email"><input required type="email" value={reminderForm.email} onChange={e=>setReminderForm({...reminderForm,email:e.target.value})} placeholder="name@example.com"/></Field><Field label="Email subject"><input required value={reminderForm.subject} onChange={e=>setReminderForm({...reminderForm,subject:e.target.value})} placeholder="Your reminder subject"/></Field><Field label="Message"><textarea required value={reminderForm.message} onChange={e=>setReminderForm({...reminderForm,message:e.target.value})} placeholder="Write your reminder message..."/></Field><div className="form-grid"><Field label="Schedule date & time"><input required type="datetime-local" value={reminderForm.scheduled_at} onChange={e=>setReminderForm({...reminderForm,scheduled_at:e.target.value})}/></Field><Field label="Repeat"><select value={reminderForm.recurrence} onChange={e=>setReminderForm({...reminderForm,recurrence:e.target.value})}><option value="once">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></Field></div><button className="primary" disabled={busy}>＋ Save reminder</button></form></section><section className="panel"><div className="panel-head"><div><div className="panel-title">Reminder queue</div><div className="panel-note">{reminders.length} reminders configured</div></div></div><div className="field"><input className="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reminders..."/></div><ReminderTable items={filtered} onRun={runReminder} onDelete={removeReminder}/></section></div>}
   {section==='Contacts'&&<div className="page-grid"><section className="panel"><div className="panel-title">Add a contact</div><div className="panel-note" style={{marginBottom:18}}>Build your recipient directory</div><form onSubmit={addContact}><Field label="Full name"><input required value={contactForm.name} onChange={e=>setContactForm({...contactForm,name:e.target.value})} placeholder="Full name"/></Field><Field label="Email address"><input required type="email" value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} placeholder="name@example.com"/></Field><Field label="Department"><input value={contactForm.department} onChange={e=>setContactForm({...contactForm,department:e.target.value})} placeholder="e.g. Operations"/></Field><button className="primary" disabled={busy}>＋ Add contact</button></form></section><section className="panel"><div className="panel-head"><div><div className="panel-title">Contact directory</div><div className="panel-note">{contacts.length} saved contacts</div></div></div><div className="table-wrap"><table><thead><tr><th>CONTACT</th><th>DEPARTMENT</th><th>ACTION</th></tr></thead><tbody>{contacts.map(c=><tr key={c.id}><td><div className="person"><div className="mini-avatar">{initials(c.name)}</div><div><b>{c.name}</b><div className="muted">{c.email}</div></div></div></td><td>{c.department}</td><td><button className="danger" onClick={()=>removeContact(c.id)}>Remove</button></td></tr>)}</tbody></table>{!contacts.length&&<div className="empty">No contacts yet.</div>}</div></section></div>}
   {section==='Email Studio'&&<div className="page-grid"><section className="panel"><div className="panel-title">Compose test email</div><div className="panel-note" style={{marginBottom:18}}>Preview your communication workflow safely</div><form onSubmit={sendTest}><Field label="Recipient email"><input required type="email" value={testForm.email} onChange={e=>setTestForm({...testForm,email:e.target.value})} placeholder="you@example.com"/></Field><Field label="Subject"><input required value={testForm.subject} onChange={e=>setTestForm({...testForm,subject:e.target.value})}/></Field><Field label="Message"><textarea required value={testForm.message} onChange={e=>setTestForm({...testForm,message:e.target.value})}/></Field><label style={{display:'flex',alignItems:'center',gap:9,fontSize:12,margin:'4px 0 17px'}}><input type="checkbox" checked={dryRun} onChange={e=>setDryRun(e.target.checked)}/> Dry-run mode (recommended — no email sent)</label><button className="primary" disabled={busy}>✉ &nbsp; {dryRun?'Simulate email':'Send real email'}</button></form></section><section className="panel"><div className="panel-title">Sending safety</div><div className="panel-note" style={{marginBottom:16}}>Understand the current delivery mode</div><div style={{padding:16,borderRadius:12,background:dryRun?'#effaf5':'#fff5e8',color:dryRun?'#16835f':'#a96b1d'}}><b>{dryRun?'Simulation is ON':'Live sending is ON'}</b><p style={{fontSize:12,lineHeight:1.6,marginBottom:0}}>{dryRun?'The system records a simulated attempt. It will not connect to SMTP or send a real email.':'Messages will be sent using your configured SMTP credentials. Use only recipients who have agreed to receive messages.'}</p></div><div style={{marginTop:20}} className="panel-title">SMTP configuration</div><p className="muted" style={{fontSize:12,lineHeight:1.7}}>Live sending is configured in <code>backend/.env</code>. Never paste passwords into this dashboard or commit them to GitHub. SMTP acceptance does not guarantee inbox delivery.</p><button className="secondary" onClick={()=>setDryRun(true)}>Switch to safe mode</button></section></div>}
   {section==='Activity Logs'&&<section className="panel"><div className="panel-head"><div><div className="panel-title">Activity history</div><div className="panel-note">A chronological record of test and send attempts</div></div><button className="secondary" onClick={refresh}>↻ Refresh</button></div><ActivityList items={activity}/></section>}
   <footer style={{fontSize:10,color:'#a0a7b5',padding:'10px 2px'}}>PulseMail · Email Automation & Reminder System · Student project workspace</footer>
  </main>
 </div>;
}

function Stat({label,value,icon,tone,foot}:{label:string;value:string|number;icon:string;tone:string;foot:string}){return <div className="stat"><div className="stat-top">{label}<span className={`stat-icon ${tone}`} style={{background:tone==='purple'?'#efeeff':tone==='orange'?'#fff4e6':tone==='green'?'#e8f8f1':'#fff0f0'}}>{icon}</span></div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="field"><label>{label}</label>{children}</div>}
function initials(s:string){return s.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function ReminderTable({items,onRun,onDelete}:{items:Reminder[];onRun:(id:string)=>void;onDelete:(id:string)=>void}){return <div className="table-wrap"><table><thead><tr><th>REMINDER</th><th>SCHEDULE</th><th>REPEAT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{items.map(r=><tr key={r.id}><td><div className="person"><div className="mini-avatar">✉</div><div><b>{r.name}</b><div className="muted">{r.email}</div></div></div></td><td>{new Date(r.scheduled_at).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td><td>{r.recurrence}</td><td><span className="pill scheduled">{r.status}</span></td><td><button className="link-btn" onClick={()=>onRun(r.id)}>Run</button> <button className="danger" onClick={()=>onDelete(r.id)}>×</button></td></tr>)}</tbody></table>{!items.length&&<div className="empty">No reminders found. Create your first reminder.</div>}</div>}
function ActivityList({items}:{items:Activity[]}){return <div className="activity">{items.map(a=><div className="activity-row" key={a.id}><div className="activity-dot">✉</div><div className="activity-copy"><strong>{a.subject||'Email activity'}</strong><small>{a.recipient} · {a.timestamp?new Date(a.timestamp).toLocaleString():'just now'}</small></div><span className={`pill ${a.status}`}>{a.status}</span></div>)}{!items.length&&<div className="empty">No activity yet. Simulate a test email to see events here.</div>}</div>}
