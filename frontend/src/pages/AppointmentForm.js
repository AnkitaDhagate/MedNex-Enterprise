// src/pages/AppointmentForm.js  — FIXED: Patient & Doctor are searchable dropdowns
import React, { useState, useEffect, useRef } from 'react';
import { appointmentAPI, patientAPI, hospitalAPI } from '../services/api';
import { toast } from 'react-toastify';
import './AppointmentForm.css';

const EMPTY = {
  appointmentId:'', patientId:null, doctorId:null, referredBy:'',
  appointmentDate:'', appointmentTime:'', durationMinutes:30,
  appointmentType:'IN_PERSON', status:'SCHEDULED',
  patientName:'', patientPhone:'', patientEmail:'', doctorName:'',
  reasonForVisit:'', symptoms:'', urgencyLevel:'MEDIUM',
  department:'', roomNumber:'', floor:'',
  consultationFee:'', discountAmount:'0.00', totalAmount:'',
  paymentStatus:'PENDING', notes:'', cancellationReason:'',
};

const DEPARTMENTS=['Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology',
  'General Medicine','Dermatology','Ophthalmology','ENT','Oncology','Psychiatry','Radiology','Emergency','ICU'];
const URGENCY_LEVELS=['LOW','MEDIUM','HIGH','EMERGENCY'];
const PAYMENT_STATUSES=['PENDING','PAID','PARTIAL','REFUNDED'];
const TIMES=Array.from({length:26},(_,i)=>{const h=Math.floor(i/2)+8;const m=i%2===0?'00':'30';return `${String(h).padStart(2,'0')}:${m}`;});

function SearchableSelect({label,placeholder,options,value,onSelect,required,loading}){
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(false);
  const wrapRef=useRef(null);
  useEffect(()=>{
    const h=(e)=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);
  const filtered=options.filter(o=>o.label.toLowerCase().includes(query.toLowerCase())||String(o.id).includes(query));
  return(
    <div className="form-group" ref={wrapRef} style={{position:'relative',gridColumn:'span 2'}}>
      <label className="form-label">{label}{required&&<span style={{color:'#f4a261'}}> *</span>}</label>
      <div className="form-control" onClick={()=>setOpen(o=>!o)}
        style={{display:'flex',alignItems:'center',cursor:'pointer',padding:'0 10px',gap:8,minHeight:42}}>
        {value
          ?<span style={{flex:1,fontSize:14,color:'#e0eaff'}}>{value.label}</span>
          :<span style={{flex:1,fontSize:13,color:'#666'}}>{placeholder}</span>}
        {value&&<span onClick={e=>{e.stopPropagation();onSelect(null);setQuery('');}}
          style={{cursor:'pointer',color:'#aaa',fontSize:16}}>✕</span>}
        <span style={{color:'#aaa',fontSize:11}}>{open?'▲':'▼'}</span>
      </div>
      {value&&<div style={{fontSize:11,color:'#8899b4',marginTop:3}}>
        ID: {value.id}{value.sub?' · '+value.sub:''}
      </div>}
      {open&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:1000,
          background:'#1e2d3d',border:'1px solid #2d4a6b',borderRadius:8,
          boxShadow:'0 8px 28px rgba(0,0,0,.55)',maxHeight:260,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'8px 10px',borderBottom:'1px solid #2d4a6b'}}>
            <input autoFocus className="form-control" style={{margin:0,fontSize:13}}
              placeholder="Type to search…" value={query}
              onChange={e=>setQuery(e.target.value)} onClick={e=>e.stopPropagation()}/>
          </div>
          <div style={{overflowY:'auto',flex:1}}>
            {loading&&<div style={{padding:'12px 14px',color:'#8899b4',fontSize:13}}>Loading…</div>}
            {!loading&&filtered.length===0&&<div style={{padding:'12px 14px',color:'#8899b4',fontSize:13}}>No results</div>}
            {!loading&&filtered.map(opt=>(
              <div key={opt.id}
                onClick={()=>{onSelect(opt);setQuery('');setOpen(false);}}
                style={{padding:'10px 14px',cursor:'pointer',fontSize:13,
                  background:value?.id===opt.id?'#1a3a5c':'transparent',borderBottom:'1px solid #182533'}}
                onMouseEnter={e=>e.currentTarget.style.background='#1a3a5c'}
                onMouseLeave={e=>e.currentTarget.style.background=value?.id===opt.id?'#1a3a5c':'transparent'}>
                <div style={{fontWeight:600,color:'#e0eaff'}}>{opt.label}</div>
                {opt.sub&&<div style={{color:'#8899b4',fontSize:11,marginTop:2}}>{opt.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppointmentForm({appointment,onClose,onSaved}){
  const [form,setForm]=useState(EMPTY);
  const [saving,setSaving]=useState(false);
  const [conflict,setConflict]=useState(null);
  const [patients,setPatients]=useState([]);
  const [doctors,setDoctors]=useState([]);
  const [loadingPat,setLPat]=useState(true);
  const [loadingDoc,setLDoc]=useState(true);
  const [selPatient,setSelPat]=useState(null);
  const [selDoctor,setSelDoc]=useState(null);

  useEffect(()=>{
    patientAPI.getAll()
      .then(r=>setPatients((r.data||[]).map(p=>({
        id:p.id, label:`${p.firstName} ${p.lastName}`,
        sub:`PatID: ${p.patientId||p.id}`,
        phone:p.mobile||p.phone||'', email:p.email||'',
      }))))
      .catch(()=>toast.error('Could not load patients'))
      .finally(()=>setLPat(false));
    hospitalAPI.getDoctors()
      .then(r=>setDoctors((r.data||[]).map(d=>({
        id:d.id, label:d.name, sub:d.specialization||'', spec:d.specialization||'',
      }))))
      .catch(()=>toast.error('Could not load doctors'))
      .finally(()=>setLDoc(false));
  },[]);

  useEffect(()=>{
    if(!appointment)return;
    setForm({...EMPTY,...appointment,
      appointmentDate:appointment.appointmentDate||'',
      appointmentTime:appointment.appointmentTime?appointment.appointmentTime.substring(0,5):'',
      symptoms:appointment.symptoms&&typeof appointment.symptoms==='object'
        ?JSON.stringify(appointment.symptoms,null,2):(appointment.symptoms||''),
    });
    if(appointment.patientId)
      setSelPat({id:appointment.patientId,label:appointment.patientName||`Patient #${appointment.patientId}`,sub:''});
    if(appointment.doctorId)
      setSelDoc({id:appointment.doctorId,label:appointment.doctorName||`Doctor #${appointment.doctorId}`,sub:appointment.department||''});
  },[appointment]);

  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setConflict(null);};

  const handlePatientSelect=(opt)=>{
    setSelPat(opt);setConflict(null);
    if(opt) setForm(f=>({...f,patientId:opt.id,patientName:opt.label,patientPhone:opt.phone||f.patientPhone,patientEmail:opt.email||f.patientEmail}));
    else setForm(f=>({...f,patientId:null,patientName:'',patientPhone:'',patientEmail:''}));
  };

  const handleDoctorSelect=(opt)=>{
    setSelDoc(opt);setConflict(null);
    if(opt) setForm(f=>({...f,doctorId:opt.id,doctorName:opt.label,department:opt.spec||f.department}));
    else setForm(f=>({...f,doctorId:null,doctorName:'',department:''}));
  };

  const buildPayload=()=>{
    const p={...form};
    p.patientId=form.patientId?Number(form.patientId):null;
    p.doctorId=form.doctorId?Number(form.doctorId):null;
    p.referredBy=form.referredBy?Number(form.referredBy):null;
    p.durationMinutes=Number(form.durationMinutes);
    p.floor=form.floor!==''?Number(form.floor):null;
    p.consultationFee=form.consultationFee!==''?Number(form.consultationFee):null;
    p.discountAmount=form.discountAmount!==''?Number(form.discountAmount):0;
    p.totalAmount=form.totalAmount!==''?Number(form.totalAmount):null;
    const raw=(form.symptoms||'').trim();
    try{p.symptoms=raw?JSON.parse(raw):null;}catch{p.symptoms=raw?{value:raw}:null;}
    return p;
  };

  const handleSubmit=async()=>{
    if(!form.patientId){toast.error('Please select a patient');return;}
    if(!form.doctorId){toast.error('Please select a doctor');return;}
    if(!form.appointmentDate){toast.error('Appointment date is required');return;}
    if(!form.appointmentTime){toast.error('Appointment time is required');return;}
    setSaving(true);
    try{
      const payload=buildPayload();
      if(appointment?.id){await appointmentAPI.update(appointment.id,payload);toast.success('Appointment updated successfully!');}
      else{await appointmentAPI.create(payload);toast.success('Appointment booked! Confirmation email sent.');}
      onSaved();
    }catch(e){
      if(e.response?.status===409){const msg=e.response.data?.error||'Doctor already booked at this time!';setConflict(msg);toast.error('⚠️ Scheduling conflict!');}
      else toast.error(e.response?.data?.error||'Booking failed. Please try again.');
    }finally{setSaving(false);}
  };

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:720}}>
        <div className="modal-header">
          <div>
            <h2>{appointment?'Edit Appointment':'Book New Appointment'}</h2>
            <p>Conflict detection enabled — double bookings are prevented automatically</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {conflict&&<div className="conflict-alert">⚠️ <strong>Scheduling Conflict:</strong> {conflict}</div>}
          <div className="form-grid">

            {/* Patient searchable dropdown — spans full width */}
            <SearchableSelect label="Patient" placeholder="Search patient by name or ID…"
              options={patients} value={selPatient} onSelect={handlePatientSelect} required loading={loadingPat}/>

            <div className="form-group">
              <label className="form-label">Patient Phone</label>
              <input className="form-control" value={form.patientPhone}
                onChange={e=>set('patientPhone',e.target.value)} placeholder="Auto-filled from patient"/>
            </div>
            <div className="form-group">
              <label className="form-label">Patient Email <small>(confirmation)</small></label>
              <input type="email" className="form-control" value={form.patientEmail}
                onChange={e=>set('patientEmail',e.target.value)} placeholder="Auto-filled from patient"/>
            </div>

            {/* Doctor searchable dropdown — spans full width */}
            <SearchableSelect label="Doctor" placeholder="Search doctor by name or specialization…"
              options={doctors} value={selDoctor} onSelect={handleDoctorSelect} required loading={loadingDoc}/>

            <div className="form-group">
              <label className="form-label">Referred By Doctor ID <small>(optional)</small></label>
              <input type="number" className="form-control" value={form.referredBy}
                onChange={e=>set('referredBy',e.target.value)} placeholder="Referring doctor's ID" min="1"/>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" value={form.department} onChange={e=>set('department',e.target.value)}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Appointment Type</label>
              <select className="form-control" value={form.appointmentType} onChange={e=>set('appointmentType',e.target.value)}>
                <option value="IN_PERSON">🏥 In Person</option>
                <option value="TELECONSULT">💻 Teleconsult</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date <span style={{color:'#f4a261'}}>*</span></label>
              <input type="date" className="form-control" value={form.appointmentDate}
                onChange={e=>set('appointmentDate',e.target.value)}
                min={new Date().toISOString().split('T')[0]}/>
            </div>
            <div className="form-group">
              <label className="form-label">Time <span style={{color:'#f4a261'}}>*</span> <small style={{color:'#8899b4'}}>(24h)</small></label>
              <select className="form-control" value={form.appointmentTime} onChange={e=>set('appointmentTime',e.target.value)}>
                <option value="">Select time</option>
                {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (min)</label>
              <select className="form-control" value={form.durationMinutes} onChange={e=>set('durationMinutes',Number(e.target.value))}>
                {[15,30,45,60,90].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
                {['SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Urgency Level</label>
              <select className="form-control" value={form.urgencyLevel} onChange={e=>set('urgencyLevel',e.target.value)}>
                {URGENCY_LEVELS.map(u=><option key={u}>{u}</option>)}
              </select>
            </div>

            <div className="form-group full">
              <label className="form-label">Reason for Visit</label>
              <textarea className="form-control" rows={2} value={form.reasonForVisit}
                onChange={e=>set('reasonForVisit',e.target.value)} placeholder="Chief complaint or reason for visit…"/>
            </div>
            <div className="form-group full">
              <label className="form-label">Symptoms <span className="badge badge-info" style={{fontSize:9}}>JSON</span></label>
              <textarea className="form-control" rows={2} value={form.symptoms}
                onChange={e=>set('symptoms',e.target.value)} placeholder='{"1":"chest pain","2":"shortness of breath"}'/>
            </div>

            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input className="form-control" value={form.roomNumber} onChange={e=>set('roomNumber',e.target.value)} placeholder="301"/>
            </div>
            <div className="form-group">
              <label className="form-label">Floor</label>
              <input type="number" className="form-control" value={form.floor} onChange={e=>set('floor',e.target.value)} placeholder="3" min="0"/>
            </div>
            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <input type="number" className="form-control" value={form.consultationFee}
                onChange={e=>set('consultationFee',e.target.value)} placeholder="500.00" min="0" step="0.01"/>
            </div>
            <div className="form-group">
              <label className="form-label">Discount (₹)</label>
              <input type="number" className="form-control" value={form.discountAmount}
                onChange={e=>set('discountAmount',e.target.value)} placeholder="0.00" min="0" step="0.01"/>
            </div>
            <div className="form-group">
              <label className="form-label">Total Amount (₹)</label>
              <input type="number" className="form-control" value={form.totalAmount}
                onChange={e=>set('totalAmount',e.target.value)} placeholder="500.00" min="0" step="0.01"/>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select className="form-control" value={form.paymentStatus} onChange={e=>set('paymentStatus',e.target.value)}>
                {PAYMENT_STATUSES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes}
                onChange={e=>set('notes',e.target.value)} placeholder="Additional notes…"/>
            </div>
            {appointment&&form.status==='CANCELLED'&&(
              <div className="form-group full">
                <label className="form-label">Cancellation Reason</label>
                <textarea className="form-control" rows={2} value={form.cancellationReason}
                  onChange={e=>set('cancellationReason',e.target.value)} placeholder="Reason for cancellation…"/>
              </div>
            )}
          </div>
          <div className="conflict-info-box">
            <span>🛡</span>
            <span>The system automatically prevents double-booking of the same doctor at the same date and time.</span>
          </div>
        </div>
        <div className="modal-footer" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving?'⏳ Booking…':(appointment?'✓ Update Appointment':'✓ Book Appointment')}
          </button>
        </div>
      </div>
    </div>
  );
}
