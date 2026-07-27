import React from 'react';
import { CONTACT_CONFIG } from '../../config/contact';
import { PAYMENT_METHODS } from '../../services/posApi';

const methodLabel = (method) =>
  PAYMENT_METHODS.find((m) => m.value === method)?.label || method;

const formatMoney = (amount) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(amount || 0)) + ' FCFA';

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
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Ticket de caisse</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500"
              >
                Imprimer
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 rounded-lg text-sm hover:bg-slate-300"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
          <div id="pos-receipt-print-area">
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

export const PosReceiptContent = ({ order, subtotal }) => (
  <div className="receipt-80mm p-2">
    <div className="center bold" style={{ fontSize: '14px' }}>
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
        <span>Caissière</span>
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
          <span>{item.quantity} x {formatMoney(item.unit_price)}</span>
          <span>{formatMoney(item.total_price)}</span>
        </div>
      </div>
    ))}
    <div className="divider" />
    <div className="row">
      <span>Sous-total</span>
      <span>{formatMoney(subtotal)}</span>
    </div>
    {Number(order.discount_amount) > 0 && (
      <>
        <div className="row">
          <span>Remise</span>
          <span>-{formatMoney(order.discount_amount)}</span>
        </div>
        {order.discount_reason && (
          <div style={{ fontSize: '10px' }}>Motif: {order.discount_reason}</div>
        )}
      </>
    )}
    <div className="row bold">
      <span>TOTAL</span>
      <span>{formatMoney(order.total_amount)}</span>
    </div>
    <div className="divider" />
    {(order.payments || []).map((p) => (
      <div key={p.id} className="row">
        <span>{methodLabel(p.method)}</span>
        <span>{formatMoney(p.amount)}</span>
      </div>
    ))}
    <div className="divider" />
    <div className="center">Merci de votre visite !</div>
  </div>
);

export default PosReceipt;
