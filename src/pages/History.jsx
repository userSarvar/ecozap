import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function History() {
  const [exports, setExports] = useState([]);
  const [partFilter, setPartFilter] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'exports'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setExports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const partNames = [...new Set(exports.map((e) => e.partName))].sort();

  const filtered = exports.filter((ex) => {
    if (partFilter && ex.partName !== partFilter) return false;
    return true;
  });

  return (
    <div className="page">
      <h2>Export history</h2>

      <div className="filters">
        <label htmlFor="partFilter">Part</label>
        <select id="partFilter" value={partFilter} onChange={(e) => setPartFilter(e.target.value)}>
          <option value="">All parts</option>
          {partNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Part</th>
            <th>Qty</th>
            <th>Car</th>
            <th>Plate</th>
            <th>Sell price</th>
            <th>Customer</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ex) => (
            <tr key={ex.id}>
              <td>{ex.timestamp?.toDate ? ex.timestamp.toDate().toLocaleString() : ''}</td>
              <td>{ex.partName}</td>
              <td>{ex.quantity}</td>
              <td>{ex.carModel}</td>
              <td>{ex.plateNumber}</td>
              <td>{ex.sellPrice}</td>
              <td>{ex.customerPhone}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7}>No exports found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
