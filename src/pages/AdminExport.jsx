import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { callApi } from '../lib/api';

export default function AdminExport() {
  const [parts, setParts] = useState([]);
  const [partId, setPartId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [carModel, setCarModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'parts'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setParts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const selectedPart = parts.find((p) => p.id === partId);

  function resetForm() {
    setPartId('');
    setQuantity('');
    setCarModel('');
    setPlateNumber('');
    setSellPrice('');
    setCustomerPhone('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qtyNum = Number(quantity);
    const priceNum = Number(sellPrice);

    if (!partId) {
      setError('Pick a part.');
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      setError('Quantity must be a whole number greater than 0.');
      return;
    }
    if (selectedPart && qtyNum > selectedPart.quantity) {
      setError(`Only ${selectedPart.quantity} in stock.`);
      return;
    }
    if (!carModel.trim()) {
      setError('Car model is required.');
      return;
    }
    if (!plateNumber.trim()) {
      setError('Plate number is required.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Sell price must be a valid number.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Customer phone number is required.');
      return;
    }

    setSubmitting(true);
    try {
      await callApi('/api/exportPart', {
        partId,
        quantity: qtyNum,
        carModel,
        plateNumber,
        sellPrice: priceNum,
        customerPhone,
      });
      setSuccess('Export recorded.');
      resetForm();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="page">
      <h2>Export a part</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="part">Part</label>
        <select id="part" value={partId} onChange={(e) => setPartId(e.target.value)} disabled={submitting}>
          <option value="">-- select part --</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
              {p.name} (in stock: {p.quantity})
            </option>
          ))}
        </select>

        <label htmlFor="quantity">Quantity</label>
        <input
          id="quantity"
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="carModel">Car model</label>
        <input
          id="carModel"
          type="text"
          value={carModel}
          onChange={(e) => setCarModel(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="plateNumber">Plate number</label>
        <input
          id="plateNumber"
          type="text"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="sellPrice">Sell price</label>
        <input
          id="sellPrice"
          type="number"
          min="0"
          step="0.01"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="customerPhone">Customer phone number</label>
        <input
          id="customerPhone"
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          disabled={submitting}
        />

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit export'}
        </button>
      </form>
    </div>
  );
}
