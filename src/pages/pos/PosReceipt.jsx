import { CONTACT_CONFIG } from '../../config/contact';
import { formatPosMoney, methodLabel } from '../../components/pos/posShared';
import { Printer, X } from 'lucide-react';

const PosReceiptContent = ({ order, subtotal }) => (
  <div className="receipt-80mm p-2">
    <div className="center mb-2">
      <img
        src="/logo-header.png"
        alt={CONTACT_CONFIG.COMPANY.name}
        style={{ height: '32px', margin: '0 auto', display: 'block' }}
      />
    </div>
    <div className="center bold" style={{ fontSize: '13px' }}>
      {CONTACT_CONFIG.COMPANY.name}
    </div>
    <div className="center">{CONTACT_CONFIG.COMPANY.address}</div>
    <div className="center">{CONTACT_CONFIG.WHATSAPP_PHONE_DISPLAY}</div>
    <div className="divider" />
    <div className="row">
      <span>Ticket</span>
      <span>{order.order_number}</span>
    </div>
    <div className="row">
      <span>Date</span>
      <span>{new Date(order.created_at).toLocaleString('fr-FR')}</span>
    </div>
    {order.cashier && (
      <div className="row">
        <span>Caissier(ère)</span>
        <span>{order.cashier.name}</span>
      </div>
    )}
    {(order.client?.name || order.walk_in_name) && (
      <div className="row">
        <span>Client</span>
        <span>{order.client?.name || order.walk_in_name}</span>
      </div>
    )}
    <div className="divider" />
    {(order.items || []).map((item) => (
      <div key={item.id} className="mb-2">
        <div>{item.product_name}{item.variant_name ? ` — ${item.variant_name}` : ''}</div>
        <div className="row">
          <span>
            {item.quantity} × {formatPosMoney(item.unit_price)}
          </span>
          <span>{formatPosMoney(item.total_price)}</span>
        </div>
      </div>
    ))}
    <div className="divider" />
    <div className="row">
      <span>Sous-total</span>
      <span>{formatPosMoney(subtotal)}</span>
    </div>
    {Number(order.discount_amount) > 0 && (
      <>
        <div className="row">
          <span>Remise</span>
          <span>-{formatPosMoney(order.discount_amount)}</span>
        </div>
        {order.discount_reason && <div style={{ fontSize: '10px' }}>Motif: {order.discount_reason}</div>}
      </>
    )}
    <div className="row bold">
      <span>TOTAL</span>
      <span>{formatPosMoney(order.total_amount)}</span>
    </div>
    <div className="divider" />
    {(order.payments || []).map((p) => (
      <div key={p.id} className="row">
        <span>{methodLabel(p.method)}</span>
        <span>{formatPosMoney(p.amount)}</span>
      </div>
    ))}
    <div className="divider" />
    <div className="center">Merci de votre visite !</div>
    <div className="center" style={{ fontSize: '10px', marginTop: '4px' }}>
      {CONTACT_CONFIG.COMPANY.website}
    </div>
  </div>
);

const PosReceipt = ({ order, onClose }) => {
  if (!order) return null;

  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="no-print fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto border border-gray-100">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center rounded-t-2xl">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ticket de caisse</h2>
              <p className="text-xs text-gray-500">{order.order_number}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-green-dark transition-colors"
              >
                <Printer size={16} />
                Imprimer
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          <div id="pos-receipt-print-area" className="p-6 flex justify-center bg-brand-cream/30">
            <PosReceiptContent order={order} subtotal={subtotal} />
          </div>
        </div>
      </div>

      <div className="print-only">
        <PosReceiptContent order={order} subtotal={subtotal} />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          .no-print { display: none !important; }
        }
        @media screen {
          .print-only { display: none; }
        }
        .receipt-80mm {
          width: 80mm;
          max-width: 80mm;
          font-family: monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: white;
        }
        .receipt-80mm .center { text-align: center; }
        .receipt-80mm .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .receipt-80mm .row {
          display: flex;
          justify-content: space-between;
          gap: 4px;
        }
        .receipt-80mm .bold { font-weight: bold; }
      `}</style>
    </>
  );
};

export { PosReceiptContent };
export default PosReceipt;
