import { useEffect, useMemo, useState } from 'react';
import { orderService, stockService } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

const emptyLine = () => ({ variant_id: '', quantity: '1' });

const CounterPreorderModal = ({ isOpen, onClose, onCreated }) => {
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    stockService.getAll().then((response) => {
      if (response.success) setCatalog(response.data.items || []);
    }).catch(() => {});
  }, [isOpen]);

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog
      .filter((item) => item.stock_status !== 'rupture')
      .filter((item) => {
        if (!q) return true;
        return `${item.product_name} ${item.variant_name} ${item.sku || ''}`.toLowerCase().includes(q);
      })
      .slice(0, 80);
  }, [catalog, search]);

  const reset = () => {
    setWalkInName('');
    setWalkInPhone('');
    setNotes('');
    setLines([emptyLine()]);
    setErrors({});
    setMessage('');
    setSearch('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      const response = await orderService.createCounterPreorder({
        walk_in_name: walkInName.trim(),
        walk_in_phone: walkInPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        items: lines
          .filter((line) => line.variant_id)
          .map((line) => ({
            variant_id: Number(line.variant_id),
            quantity: Number(line.quantity) || 1,
          })),
      });
      if (response.success) {
        onCreated?.(response);
        handleClose();
      }
    } catch (err) {
      setErrors(err.errors || {});
      setMessage(err.message || 'Enregistrement impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Précommande au comptoir" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Pour un client qui commande un article pas encore en rayon. Il entre en file : le prochain camion le sert en premier.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client *</label>
            <Input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} required />
            {errors.walk_in_name && <p className="text-sm text-red-600 mt-1">{errors.walk_in_name[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <Input value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} placeholder="+226…" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher un article</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, variante, SKU…" />
        </div>
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2">
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                value={line.variant_id}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...next[index], variant_id: e.target.value };
                  setLines(next);
                }}
                required
              >
                <option value="">Choisir un article</option>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.product_name} · {item.variant_name}
                    {item.stock_status === 'sur_commande' ? ' (sur commande)' : ''}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...next[index], quantity: e.target.value };
                  setLines(next);
                }}
              />
              {lines.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                >
                  Retirer
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setLines([...lines, emptyLine()])}>
            Ajouter un article
          </Button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionnel" />
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Fermer
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Mettre en file
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CounterPreorderModal;
