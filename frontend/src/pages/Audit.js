// src/pages/Audit.js — Premium Audit Log
import React, { useEffect, useState } from 'react';
import { auditAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Audit.css';

const ACTION_COLOR = {
  LOGIN:'success', LOGOUT:'muted', CREATE:'info', READ:'muted',
  UPDATE:'warning', DELETE:'danger', EXPORT:'violet', VIEW:'muted'
};
const ACTION_ICON = {
  LOGIN:'🔑', LOGOUT:'↩', CREATE:'➕', READ:'👁', UPDATE:'✏️', DELETE:'🗑️', EXPORT:'📄', VIEW:'👁'
};

const formatTs = ts => {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

export default function Audit() {
  const [logs, setLogs]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    auditAPI.getLogs()
      .then(r => { setLogs(r.data||[]); setFiltered(r.data||[]); })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = [...logs];
    if (search) data = data.filter(l =>
      (l.username||'').toLowerCase().includes(search.toLowerCase()) ||
      (l.action||'').toLowerCase().includes(search.toLowerCase()) ||
      (l.entityType||'').toLowerCase().includes(search.toLowerCase()) ||
      (l.reason||'').toLowerCase().includes(search.toLowerCase())
    );
    if (actionFilter !== 'ALL') data = data.filter(l => l.action === actionFilter);
    if (entityFilter !== 'ALL') data = data.filter(l => l.entityType === entityFilter);
    setFiltered(data);
  }, [logs, search, actionFilter, entityFilter]);

  const actions  = [...new Set(logs.map(l => l.action).filter(Boolean))];
  const entities = [...new Set(logs.map(l => l.entityType).filter(Boolean))];

  const loginCount  = logs.filter(l => l.action === 'LOGIN').length;
  const exportCount = logs.filter(l => l.action === 'EXPORT').length;
  const deleteCount = logs.filter(l => l.action === 'DELETE').length;
  const createCount = logs.filter(l => l.action === 'CREATE').length;

  return (
    <div className="audit-page">

      {/* Header */}
      <div className="audit-banner">
        <div className="audit-banner-left">
          <div className="audit-shield">🔐</div>
          <div>
            <h1>Audit Log &amp; Compliance Monitor</h1>
            <p>Track who accessed which record and when — HIPAA/GDPR Access Log Compliance (Week 4)</p>
          </div>
        </div>
        <div className="audit-compliance-chips">
          <span className="comp-chip comp-hipaa">HIPAA</span>
          <span className="comp-chip comp-gdpr">GDPR</span>
          <span className="comp-chip comp-active">● LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-16">
        {[
          { label:'Total Events', value:logs.length,    icon:'📋', color:'rgba(0,212,255,0.08)',   border:'rgba(0,212,255,0.15)',   text:'var(--cyan)' },
          { label:'Login Events', value:loginCount,     icon:'🔑', color:'rgba(0,229,160,0.08)',   border:'rgba(0,229,160,0.15)',   text:'var(--emerald)' },
          { label:'Exports',      value:exportCount,    icon:'📄', color:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.15)',  text:'var(--amber)' },
          { label:'Deletions',    value:deleteCount,    icon:'🗑️', color:'rgba(244,63,94,0.08)',   border:'rgba(244,63,94,0.15)',   text:'var(--rose)' },
        ].map(s => (
          <div key={s.label} className="audit-stat" style={{background:s.color, borderColor:s.border}}>
            <div className="as-icon">{s.icon}</div>
            <div className="as-val" style={{color:s.text}}>{s.value}</div>
            <div className="as-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div style={{position:'relative',flex:1,minWidth:220}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}>🔍</span>
            <input className="form-control" style={{paddingLeft:38}}
              placeholder="Search user, action, entity…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{width:140}} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="ALL">All Actions</option>
            {actions.map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="form-control" style={{width:140}} value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="ALL">All Entities</option>
            {entities.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{fontSize:12,color:'var(--text-muted)'}}>{filtered.length} events</span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{padding:20}}>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{height:48,marginBottom:8,borderRadius:8}} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <h3>No audit logs found</h3>
            <p>{search ? `No results for "${search}"` : 'Audit events will appear here as users interact with the system'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Timestamp</th><th>User</th><th>Action</th>
                  <th>Entity</th><th>Record ID</th><th>Reason / Details</th><th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l,i) => (
                  <React.Fragment key={l.id || i}>
                    <tr
                      className={`audit-row action-${l.action?.toLowerCase()} ${expanded === i ? 'expanded' : ''}`}
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      style={{cursor:'pointer'}}
                    >
                      <td><span style={{fontSize:11,color:'var(--text-faint)'}}>{i+1}</span></td>
                      <td>
                        <div style={{fontSize:12,color:'var(--text-primary)',fontWeight:600}}>{formatTs(l.createdAt)}</div>
                      </td>
                      <td>
                        <div className="info-cell">
                          <div className="avatar avatar-sm" style={{background:'#7c3aed',fontSize:11}}>
                            {(l.username||'?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontWeight:600,fontSize:12,color:'var(--text-primary)'}}>{l.username||'system'}</div>
                            <div style={{fontSize:10,color:'var(--text-muted)'}}>{l.tenantId||'—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`action-pill action-${(l.action||'').toLowerCase()}`}>
                          {ACTION_ICON[l.action] || '•'} {l.action}
                        </span>
                      </td>
                      <td><span style={{fontSize:12,color:'var(--text-secondary)'}}>{l.entityType||'—'}</span></td>
                      <td>
                        {l.entityId ? <code style={{fontSize:11,color:'var(--cyan)',background:'rgba(0,212,255,0.06)',padding:'2px 7px',borderRadius:4}}>{l.entityId}</code> : '—'}
                      </td>
                      <td>
                        <div style={{fontSize:12,color:'var(--text-muted)',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {l.reason || '—'}
                        </div>
                      </td>
                      <td>
                        <span style={{fontSize:11,fontFamily:'monospace',color:'var(--text-muted)'}}>{l.ipAddress||'—'}</span>
                      </td>
                    </tr>
                    {expanded === i && (
                      <tr>
                        <td colSpan={8} style={{padding:'0 20px 16px',background:'rgba(0,212,255,0.02)'}}>
                          <div className="audit-detail-panel">
                            <div className="adp-row">
                              <span className="adp-key">Full Timestamp</span>
                              <span className="adp-val">{l.createdAt||'—'}</span>
                            </div>
                            <div className="adp-row">
                              <span className="adp-key">User Agent</span>
                              <span className="adp-val">{l.userAgent||'—'}</span>
                            </div>
                            <div className="adp-row">
                              <span className="adp-key">Request URL</span>
                              <span className="adp-val">{l.requestUrl||'—'}</span>
                            </div>
                            {l.oldValue && (
                              <div className="adp-row">
                                <span className="adp-key">Before</span>
                                <pre className="adp-json">{JSON.stringify(l.oldValue,null,2)}</pre>
                              </div>
                            )}
                            {l.newValue && (
                              <div className="adp-row">
                                <span className="adp-key">After</span>
                                <pre className="adp-json">{JSON.stringify(l.newValue,null,2)}</pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
