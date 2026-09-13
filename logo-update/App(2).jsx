import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";
const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})`;

function App(){
  const [token,setToken]=useState(localStorage.getItem("tn_token")||"");
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [open,setOpen]=useState(false);
  const [toast,setToast]=useState("");
  const [loading,setLoading]=useState(false);

  const [authMode,setAuthMode]=useState("login");
  const [auth,setAuth]=useState({name:"",email:"",password:""});
  const [deposit,setDeposit]=useState({method:"USDT",network:"TRC20",amount:"",walletAddress:"",proof:null,qr:null});
  const [withdraw,setWithdraw]=useState({network:"TRC20",amount:"",walletAddress:"",transactionPassword:""});
  const [profile,setProfile]=useState({name:"",phone:"",country:""});
  const [settings,setSettings]=useState({loginPassword:"",newLoginPassword:"",transactionPassword:"",newTransactionPassword:""});
  const [data,setData]=useState({transactions:[],deposits:[],withdrawals:[],referrals:[]});

  const flash=(m)=>{setToast(m);setTimeout(()=>setToast(""),3500)};
  const headers=()=>({ "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) });

  async function load(){
    if(!token){setUser(null);return}
    try{
      const r=await fetch(`${API}/me`,{headers:headers()});
      if(!r.ok) throw new Error("Session expired");
      const j=await r.json();
      setUser(j.user); setData(j.data||{transactions:[],deposits:[],withdrawals:[],referrals:[]});
      setProfile({name:j.user.name||"",phone:j.user.phone||"",country:j.user.country||""});
    }catch(e){localStorage.removeItem("tn_token");setToken("");setUser(null);flash(e.message)}
  }
  useEffect(()=>{load()},[token]);

  async function post(path,body){
    setLoading(true);
    try{
      const r=await fetch(`${API}${path}`,{method:"POST",headers:headers(),body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok) throw new Error(j.message||"Request failed");
      return j;
    }finally{setLoading(false)}
  }

  async function submitAuth(e){
    e.preventDefault();
    try{
      const j=await post(authMode==="login"?"/login":"/register",auth);
      localStorage.setItem("tn_token",j.token);setToken(j.token);flash(j.message||"Success");setPage("dashboard");
    }catch(e){flash(e.message)}
  }

  async function submitDeposit(e){
    e.preventDefault();
    if(!deposit.amount || Number(deposit.amount)<=0) return flash("Amount enter karein");
    if(deposit.method==="USDT" && !deposit.walletAddress && !deposit.qr) return flash("Wallet address ya QR upload karein");
    if(!deposit.proof) return flash("Payment proof upload karein");
    try{
      const j=await post("/deposits",{
        method:deposit.method,network:deposit.method==="USDT"?deposit.network:"CASH",
        amount:Number(deposit.amount),walletAddress:deposit.walletAddress,
        proof:deposit.proof,qr:deposit.qr
      });
      flash(`Deposit submitted. TXN ID: ${j.deposit.txnId}`);
      setDeposit({method:"USDT",network:"TRC20",amount:"",walletAddress:"",proof:null,qr:null});
      await load();setPage("transactions");
    }catch(e){flash(e.message)}
  }

  async function submitWithdraw(e){
    e.preventDefault();
    if(!user) return setPage("login");
    try{
      const j=await post("/withdrawals",{...withdraw,amount:Number(withdraw.amount)});
      flash(`Withdrawal request created: ${j.withdrawal.txnId}`);
      setWithdraw({network:"TRC20",amount:"",walletAddress:"",transactionPassword:""});
      await load();setPage("transactions");
    }catch(e){flash(e.message)}
  }

  async function saveProfile(e){
    e.preventDefault();
    try{const j=await post("/profile",profile);setUser(j.user);flash("Profile updated");await load()}catch(e){flash(e.message)}
  }
  async function savePasswords(e){
    e.preventDefault();
    try{
      const j=await post("/settings",settings);flash(j.message);
      setSettings({loginPassword:"",newLoginPassword:"",transactionPassword:"",newTransactionPassword:""});
    }catch(e){flash(e.message)}
  }

  function fileToData(file,cb){
    if(!file)return;
    if(file.size>5*1024*1024)return flash("File 5MB se chhoti rakhein");
    const reader=new FileReader();reader.onload=()=>cb(reader.result);reader.readAsDataURL(file);
  }

  const balance=Number(user?.balance||0);
  const totalDeposit=Number(user?.totalDeposit||0);
  const pendingDeposit=Number(user?.pendingDeposit||0);
  const profit=Number(user?.profit||0);

  const chart=useMemo(()=>{
    const pts=[]; let v=100;
    for(let i=0;i<31;i++){v += (Math.sin(i*.65)*0.35)+0.22;pts.push(v)}
    const min=Math.min(...pts),max=Math.max(...pts);
    return pts.map((v,i)=>({x:10+i*10.6,y:115-(v-min)/(max-min||1)*88}));
  },[]);
  const path=chart.map((p,i)=>(i?"L":"M")+`${p.x},${p.y}`).join(" ");

  const nav=[
    ["dashboard","⌂","Dashboard"],["deposit","💳","Deposit"],["withdraw","↗","Withdraw"],
    ["transactions","⇄","Transactions"],["performance","📈","Performance"],["referrals","🔗","Referrals"],
    ["profile","👤","Profile"],["settings","⚙","Settings"]
  ];

  function Shell({children}){
    return <div className="app">
      <aside className={`sidebar ${open?"show":""}`}>
        <div className="brand premium-brand" style={{display:"block",padding:"8px 6px 22px",textAlign:"center"}}><img src="/tradenex-premium-logo.png" alt="Tradenex" className="premium-logo" style={{width:"100%",maxWidth:"210px",height:"auto",display:"block",margin:"0 auto",objectFit:"contain"}} /></div>
        <div className="menuTitle">MAIN MENU</div>
        {nav.map(([id,ic,label])=><button key={id} className={page===id?"nav active":"nav"} onClick={()=>{setPage(id);setOpen(false)}}><span>{ic}</span>{label}</button>)}
        <div className="menuTitle account">ACCOUNT</div>
        {user?<button className="nav" onClick={()=>{localStorage.removeItem("tn_token");setToken("");setPage("dashboard");setOpen(false)}}><span>⇥</span>Logout</button>:<><button className="nav" onClick={()=>{setPage("login");setOpen(false)}}><span>→</span>Login</button><button className="nav" onClick={()=>{setAuthMode("register");setPage("login");setOpen(false)}}><span>＋</span>Create Account</button></>}
      </aside>
      {open&&<div className="overlay" onClick={()=>setOpen(false)}/>}
      <main className="main">
        <header className="top"><button className="hamb" onClick={()=>setOpen(true)}>☰</button><div><h3>{page==="dashboard"?"Dashboard":page[0].toUpperCase()+page.slice(1)}</h3><small>Tradenex User Dashboard</small></div><div className="userMini">🔔<span>{user?user.name:"Guest"}<small>{user?user.email:"Not logged in"}</small></span></div></header>
        {toast&&<div className="toast">{toast}</div>}
        <div className="content">{children}</div>
      </main>
    </div>
  }

  function Login(){
    return <div className="authPage"><div className="authCard"><img src="/tradenex-premium-logo.png" alt="Tradenex" className="login-premium-logo" style={{width:"220px",maxWidth:"80vw",height:"auto",display:"block",margin:"0 auto 22px",borderRadius:"18px"}} /><h1>{authMode==="login"?"Welcome back":"Create account"}</h1><p>{authMode==="login"?"Login to your Tradenex account":"Create your user account"}</p>
      <form onSubmit={submitAuth}>{authMode==="register"&&<input placeholder="Full name" value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})} required/>}<input type="email" placeholder="Email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} required/><input type="password" placeholder="Password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} required minLength="6"/><button className="primary" disabled={loading}>{loading?"Please wait...":authMode==="login"?"Login":"Create Account"}</button></form>
      <button className="linkBtn" onClick={()=>setAuthMode(authMode==="login"?"register":"login")}>{authMode==="login"?"Create new account":"Already have an account? Login"}</button></div></div>
  }

  function Dashboard(){
    return <><section className="hero"><div className="eyebrow">TRADENEX USER PANEL</div><h1>Welcome back 👋</h1><p>Manage your wallet, deposits, withdrawals and account.</p>{!user&&<div><button className="primary small" onClick={()=>setPage("login")}>Login</button><button className="secondary small" onClick={()=>{setAuthMode("register");setPage("login")}}>Create Account</button></div>}</section>
      <div className="stats">{[[`💰`,fmt(balance),"Wallet Balance"],["💵",fmt(totalDeposit),"Total Deposit"],["⌛",fmt(pendingDeposit),"Pending Deposit"],["📈",fmt(profit),"Profit"]].map(x=><div className="stat" key={x[2]}><i>{x[0]}</i><b>{x[1]}</b><span>{x[2]}</span></div>)}</div>
      <div className="quick"><button onClick={()=>setPage("deposit")}>💳 Deposit</button><button onClick={()=>setPage("withdraw")}>↗ Withdraw</button><button onClick={()=>setPage("transactions")}>⇄ Transactions</button></div>
      <section className="panel"><div className="panelHead"><div><h2>Profit Performance</h2><p>Demo performance visualization • monthly target 12%</p></div><b className="green">12% / month</b></div><Chart path={path}/></section>
      <Activity data={data.transactions.slice(0,5)} title="Recent Transactions" empty="No transactions yet."/><Activity data={data.deposits.slice(0,5)} title="Recent Deposits" empty="No deposits yet."/>
    </>
  }

  function Chart({path}){return <div className="chart"><svg viewBox="0 0 340 130" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopOpacity=".28"/><stop offset="1" stopOpacity="0"/></linearGradient></defs><path d={path+" L328,125 L10,125 Z"} fill="url(#fill)"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5"/></svg><div className="chartLabels"><span>Day 1</span><span>Day 15</span><span>Day 30</span></div></div>}

  function Activity({data,title,empty}){return <section className="panel"><div className="panelHead"><div><h2>{title}</h2><p>Latest wallet activity</p></div><button className="textBtn" onClick={()=>setPage("transactions")}>View all</button></div>{data.length?data.map(x=><div className="row" key={x.id||x.txnId}><span>💸 <b>{x.txnId}</b><small>{x.method||x.type} • {x.network||""}</small></span><strong>{fmt(x.amount)}</strong><em className={String(x.status).toLowerCase()}>{x.status}</em></div>):<div className="empty">📭<br/>{empty}</div>}</section>}

  function Deposit(){
    return <section className="formPage"><div className="pageIntro"><h1>Deposit</h1><p>Submit a USDT or Cash deposit for admin approval.</p></div><div className="formCard"><div className="tabs"><button className={deposit.method==="USDT"?"sel":""} onClick={()=>setDeposit({...deposit,method:"USDT"})}>USDT</button><button className={deposit.method==="CASH"?"sel":""} onClick={()=>setDeposit({...deposit,method:"CASH"})}>Cash</button></div>
      <form onSubmit={submitDeposit}><label>Amount (USD)<input type="number" min="1" step="0.01" value={deposit.amount} onChange={e=>setDeposit({...deposit,amount:e.target.value})} required/></label>
      {deposit.method==="USDT"&&<><label>Network<select value={deposit.network} onChange={e=>setDeposit({...deposit,network:e.target.value})}><option>TRC20</option><option>BEP20</option></select></label><label>Wallet address<input value={deposit.walletAddress} onChange={e=>setDeposit({...deposit,walletAddress:e.target.value})} placeholder="Your sending wallet address"/></label><label>Wallet QR <input type="file" accept="image/*" onChange={e=>fileToData(e.target.files[0],v=>setDeposit({...deposit,qr:v}))}/></label></>}
      <label>Payment proof / receipt <input type="file" accept="image/*,.pdf" onChange={e=>fileToData(e.target.files[0],v=>setDeposit({...deposit,proof:v}))}/></label>
      <button className="primary" disabled={loading}>{loading?"Submitting...":"Submit Deposit"}</button></form><p className="note">A unique transaction ID is generated automatically. Deposit remains pending until admin approval.</p></div></section>
  }

  function Withdraw(){
    return <section className="formPage"><div className="pageIntro"><h1>Withdraw USDT</h1><p>Available balance: <b>{fmt(balance)}</b></p></div>{!user?<div className="notice">Please <button onClick={()=>setPage("login")}>Login</button> first.</div>:<div className="formCard"><div className="requirements"><b>Withdrawal requirements</b><span>✓ Minimum 3 approved referrals</span><span>✓ Transaction password required</span><span>✓ Sufficient available balance</span></div><form onSubmit={submitWithdraw}><label>Network<select value={withdraw.network} onChange={e=>setWithdraw({...withdraw,network:e.target.value})}><option>TRC20</option><option>BEP20</option></select></label><label>Amount (USDT)<input type="number" min="1" step=".01" value={withdraw.amount} onChange={e=>setWithdraw({...withdraw,amount:e.target.value})} required/></label><label>USDT wallet address<input value={withdraw.walletAddress} onChange={e=>setWithdraw({...withdraw,walletAddress:e.target.value})} required/></label><label>Transaction password<input type="password" value={withdraw.transactionPassword} onChange={e=>setWithdraw({...withdraw,transactionPassword:e.target.value})} required/></label><button className="primary" disabled={loading}>{loading?"Submitting...":"Submit Withdrawal"}</button></form></div>}</section>
  }

  function Transactions(){return <><div className="pageIntro"><h1>Transactions</h1><p>Your complete wallet activity.</p></div><section className="panel"><div className="tableWrap">{[...data.transactions,...data.deposits,...data.withdrawals].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(x=><div className="row" key={(x.id||x.txnId)+"t"}><span>💸 <b>{x.txnId}</b><small>{x.type||"Deposit"} • {x.network||""} • {new Date(x.createdAt).toLocaleString()}</small></span><strong>{fmt(x.amount)}</strong><em className={String(x.status).toLowerCase()}>{x.status}</em></div>)}</div>{!data.transactions.length&&!data.deposits.length&&!data.withdrawals.length&&<div className="empty">📭<br/>No transactions yet.</div>}</section></>}

  function Performance(){return <><div className="pageIntro"><h1>Performance</h1><p>Live-style chart inspired by your reference image.</p></div><section className="panel"><div className="panelHead"><div><h2>Daily simulated profit</h2><p>Demo only — 12% monthly target, not a guaranteed return.</p></div><b className="green">12%</b></div><Chart path={path}/><div className="miniGrid">{["Day 1","Day 7","Day 14","Day 21","Day 30"].map((x,i)=><div key={x}><span>{x}</span><b>{(i*0.4+0.4).toFixed(2)}%</b></div>)}</div></section></>}

  function Referrals(){return <><div className="pageIntro"><h1>Referrals</h1><p>Referral reward rules and your referral activity.</p></div><div className="refGrid"><div className="panel big"><h2>Referral reward</h2><b className="reward">100 USDT</b><p>Demo reward for each approved referred deposit of 1,000 USDT or more.</p><div className="refCode">{user?.referralCode||"Login to view code"}</div></div><div className="panel"><h2>Withdrawal eligibility</h2><b className="count">{data.referrals.filter(x=>x.status==="approved").length} / 3</b><p>Minimum 3 approved referrals are required before withdrawal.</p></div></div><section className="panel">{data.referrals.length?data.referrals.map(r=><div className="row" key={r.id}><span>👤 <b>{r.email}</b><small>Deposit {fmt(r.depositAmount)}</small></span><strong>{r.reward?`+${fmt(r.reward)}`:"—"}</strong><em className={r.status}>{r.status}</em></div>):<div className="empty">🔗<br/>No referrals yet.</div>}</section></>}

  function Profile(){return <section className="formPage"><div className="pageIntro"><h1>Profile</h1><p>Edit your account details.</p></div><div className="formCard"><form onSubmit={saveProfile}><label>Name<input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></label><label>Email<input value={user?.email||""} disabled/></label><label>Phone<input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label><label>Country<input value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}/></label><button className="primary">Save Profile</button></form></div></section>}

  function Settings(){return <section className="formPage"><div className="pageIntro"><h1>Settings</h1><p>Login and transaction password controls.</p></div><div className="formCard"><form onSubmit={savePasswords}><h3>Login password</h3><label>Current password<input type="password" value={settings.loginPassword} onChange={e=>setSettings({...settings,loginPassword:e.target.value})}/></label><label>New password<input type="password" minLength="6" value={settings.newLoginPassword} onChange={e=>setSettings({...settings,newLoginPassword:e.target.value})}/></label><hr/><h3>Transaction password</h3><p className="note">This password is used only for withdrawals.</p><label>Current transaction password<input type="password" value={settings.transactionPassword} onChange={e=>setSettings({...settings,transactionPassword:e.target.value})}/></label><label>New transaction password<input type="password" minLength="4" value={settings.newTransactionPassword} onChange={e=>setSettings({...settings,newTransactionPassword:e.target.value})}/></label><button className="primary">Save Passwords</button></form></div></section>}

  const view={dashboard:<Dashboard/>,deposit:<Deposit/>,withdraw:<Withdraw/>,transactions:<Transactions/>,performance:<Performance/>,referrals:<Referrals/>,profile:<Profile/>,settings:<Settings/>,login:<Login/>}[page]||<Dashboard/>;
  return page==="login"?<Shell>{view}</Shell>:<Shell>{view}</Shell>;
}
export default App;
