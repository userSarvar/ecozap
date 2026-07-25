import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

const TYPE_LABELS = {
  new: 'New',
  edit: 'Edit',
  export: 'Export',
};

const TYPE_COLORS = {
  new: '#1a7f37',
  edit: '#b35c00',
  export: '#c0392b',
};

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || '#555';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.85em',
        fontWeight: 600,
        color: '#fff',
        backgroundColor: color,
      }}
    >
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function toLocalDatetimeInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function csvEscape(value) {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function History() {
  const [entries, setEntries] = useState([]);
  const [partFilter, setPartFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const partNames = [...new Set(entries.map((e) => e.partName))].sort();

  const filtered = entries.filter((e) => {
    if (partFilter && e.partName !== partFilter) return false;
    if (typeFilter && e.type !== typeFilter) return false;

    const ts = e.timestamp?.toDate ? e.timestamp.toDate() : null;
    if (dateFrom && ts) {
      const from = new Date(dateFrom);
      if (ts < from) return false;
    }
    if (dateTo && ts) {
      const to = new Date(dateTo);
      if (ts > to) return false;
    }
    return true;
  });

  function clearFilters() {
    setPartFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
  }

  function downloadCsv() {
    const headers = ['Type', 'Date', 'Part', 'Quantity', 'Price', 'Car', 'Plate', 'Customer', 'By'];

    const rows = filtered.map((e) => {
      const ts = e.timestamp?.toDate ? e.timestamp.toDate().toLocaleString() : '';
      return [
        TYPE_LABELS[e.type] || e.type,
        ts,
        e.partName,
        e.quantity,
        e.price,
        e.carModel || '',
        e.plateNumber || '',
        e.customerPhone || '',
        e.performedByAlias || '',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = toLocalDatetimeInputValue(new Date()).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `history-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <h2>History</h2>

      <div className="filters">
        <label htmlFor="typeFilter">Type</label>
        <select id="typeFilter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="new">New</option>
          <option value="edit">Edit</option>
          <option value="export">Export</option>
        </select>

        <label htmlFor="partFilter">Part</label>
        <select id="partFilter" value={partFilter} onChange={(e) => setPartFilter(e.target.value)}>
          <option value="">All parts</option>
          {partNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <label htmlFor="dateFrom">From</label>
        <input id="dateFrom" type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />

        <label htmlFor="dateTo">To</label>
        <input id="dateTo" type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <button type="button" onClick={clearFilters}>
          Clear filters
        </button>
        <button type="button" onClick={downloadCsv} disabled={filtered.length === 0}>
          Download CSV
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>Part</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Car</th>
            <th>Plate</th>
            <th>Customer</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => (
            <tr key={e.id}>
              <td><TypeBadge type={e.type} /></td>
              <td>{e.timestamp?.toDate ? e.timestamp.toDate().toLocaleString() : ''}</td>
              <td>{e.partName}</td>
              <td>{e.quantity}</td>
              <td>{e.price}</td>
              <td>{e.carModel || '—'}</td>
              <td>{e.plateNumber || '—'}</td>
              <td>{e.customerPhone || '—'}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8}>No history found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}