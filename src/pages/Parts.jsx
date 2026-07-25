import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { callApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Parts() {
  const { isAdmin } = useAuth();
  const [parts, setParts] = useState([]);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'parts'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setParts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function handleAddPart(e) {
    e.preventDefault();
    setError('');

    const qtyNum = Number(quantity);
    const priceNum = Number(price);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      setError('Quantity must be a whole number (0 or more).');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Price must be a valid number.');
      return;
    }

    setSubmitting(true);
    try {
      await callApi('/api/upsertPart', {
        name: name.trim(),
        quantity: qtyNum,
        price: priceNum,
      });
      setName('');
      setQuantity('');
      setPrice('');
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  function startEdit(part) {
    setEditingId(part.id);
    setEditName(part.name);
    setEditQuantity(String(part.quantity));
    setEditPrice(String(part.price));
    setEditError('');
  }

  async function saveEdit(partId) {
    setEditError('');
    const qtyNum = Number(editQuantity);
    const priceNum = Number(editPrice);

    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      setEditError('Quantity must be a whole number (0 or more).');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setEditError('Price must be a valid number.');
      return;
    }

    setSavingEdit(true);
    try {
      await callApi('/api/upsertPart', {
        partId,
        name: editName.trim(),
        quantity: qtyNum,
        price: priceNum,
      });
      setEditingId(null);
    } catch (err) {
      setEditError(err.message);
    }
    setSavingEdit(false);
  }

  async function handleDelete(part) {
    if (part.quantity !== 0) return;
    if (!confirm('Delete this part? This cannot be undone.')) return;
    setError('');
    setDeletingId(part.id);
    try {
      await callApi('/api/deletePart', { partId: part.id });
    } catch (err) {
      setError(err.message);
    }
    setDeletingId(null);
  }

  return (
    <div className="page">
      <h2>Parts inventory</h2>

      {isAdmin && (
        <form className="form-card" onSubmit={handleAddPart}>
          <h3>Add new part</h3>

          <label htmlFor="name">Part name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />

          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={submitting}
          />

          <label htmlFor="price">Price</label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={submitting}
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add part'}
          </button>
        </form>
      )}

      <h3>Current inventory</h3>
      {editError && <p className="error-text">{editError}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Price</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.id}>
              {isAdmin && editingId === part.id ? (
                <>
                  <td>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={savingEdit} />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      disabled={savingEdit}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      disabled={savingEdit}
                    />
                  </td>
                  <td>
                    <button onClick={() => saveEdit(part.id)} disabled={savingEdit}>
                      {savingEdit ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} disabled={savingEdit}>
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{part.name}</td>
                  <td>{part.quantity}</td>
                  <td>{part.price}</td>
                  {isAdmin && (
                    <td>
                      <button onClick={() => startEdit(part)}>Edit</button>
                      <button
                        onClick={() => handleDelete(part)}
                        disabled={part.quantity !== 0 || deletingId === part.id}
                        title={part.quantity !== 0 ? 'Quantity must be 0 to delete' : undefined}
                      >
                        {deletingId === part.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
          {parts.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 4 : 3}>No parts yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}