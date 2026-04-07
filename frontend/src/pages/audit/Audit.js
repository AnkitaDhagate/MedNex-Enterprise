import React, { useEffect, useState } from 'react';
import { auditAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Audit.css';

export default function Audit() {
  const [logs, setLogs]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    auditAPI.getLogs()
      .then(r => { setLogs(r.data || []); setFiltered(r.data || []); })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = [...logs];
    if (search) data = data.filter(l =>
      (l.username||'').toLowerCase().includes(search.toLowerCase()) ||
      (l.action||'').toLowerCase().includes(search.toLowerCase()) ||
      (l.entityType||'').toLowerCase().includes(search.toLowerCase())
    );
    if (actionFilter !== 'ALL') data = data.filter(l => l.action === actionFilter);
    setFiltered(data);
  }, [logs, search, actionFilter]);

  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))];
  const actionColor = a => ({ LOGIN:'success', LOGOUT:'muted', CREATE:'info', UPDATE:'warning', DELETE:'danger', EXPORT:'teal', VIEW:'muted' }[a] || 'muted');

  return (
    <div className="audit-page fade-in">
      {/* Header */}
      <div className="audit-hero card">
        <div>
          <h2>Audit Log & Compliance Monitor</h2>
          <p>Track who accessed which record and when — HIPAA/GDPR Access Log Compliance</p>
        </div>
        <div className="audit-badge">
          <span>🔒</span>
          <div>
            <div>HIPAA Compliant</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>Audit Trail Active</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="audit-stats grid-4">
        {[
          { label:'Total Events',  value: logs.length,       icon:'📋', color:'teal' },
          { label:'Login Events',  value: logs.filter(l=>l.action==='LOGIN').length, icon:'🔑', color:'success' },
          { label:'Exports',       value: logs.filter(l=>l.action==='EXPORT').length, icon:'📄', color:'warning' },
          { label:'Deletions',     value: logs.filter(l=>l.action==='DELETE').length, icon:'🗑', color:'danger' },
        ].map((s,i) => (
          <div key={i} className={`audit-stat card color-${s.color}`}>
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card audit-filters">
        <input className="form-control" placeholder="🔍 Search by user, action, entity…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}} />
        <select className="form-control" value={actionFilter} onChange={e=>setActionFilter(e.target.value)} style={{width:160}}>
          <option value="ALL">All Actions</option>
          {actions.map(a => <option key={a}>{a}</option>)}
        </select>
        <span style={{fontSize:13, color:'var(--text-muted)', whiteSpace:'nowrap'}}>{filtered.length} events</span>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-rows">{[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{height:48,margin:'8px 16px',borderRadius:8}}></div>)}</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">No audit logs found</td></tr>
                ) : filtered.map((l, i) => (
                  <tr key={i} className={`audit-row action-${l.action?.toLowerCase()}`}>
                    <td style={{color:'var(--text-muted)',fontSize:12}}>{i+1}</td>
                    <td>
                      <div style={{fontSize:13,color:'var(--text-primary)'}}>{formatTs(l.timestamp)}</div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="mini-avatar">{(l.username||'?').charAt(0).toUpperCase()}</div>
                        <span style={{color:'var(--text-primary)',fontSize:13}}>{l.username || '—'}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${actionColor(l.action)}`}>{l.action}</span></td>
                    <td style={{color:'var(--text-secondary)'}}>{l.entityType || '—'}</td>
                    <td><code className="pid">{l.entityId || '—'}</code></td>
                    <td style={{color:'var(--text-muted)',fontSize:12,maxWidth:200}}>{l.details ? truncate(l.details, 50) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GDPR Note */}
      <div className="gdpr-note card">
        <span>⚖️</span>
        <p>
          Audit logs are retained for compliance with <strong>HIPAA §164.312(b)</strong> and <strong>GDPR Article 30</strong>.
          All access events, data exports, and modifications are permanently logged and cannot be deleted.
        </p>
      </div>
    </div>
  );
}

function formatTs(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function truncate(s, n) { return s.length > n ? s.substring(0,n)+'…' : s; }
