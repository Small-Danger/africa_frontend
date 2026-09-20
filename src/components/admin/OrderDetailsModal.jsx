import React, { useEffect, useState } from 'react';
import { XMarkIcon, UserIcon, PhoneIcon, ChatBubbleLeftRightIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';

const paymentBadgeVariant = {
  non_paye: 'warning',
  partiel: 'info',
  paye: 'success',
};

const OrderDetailsModal = ({ 
  order, 
  isOpen, 
  onClose, 
  onContact,
  onStatusChange,
  updatingOrder,
  canCancel = false,
  canRecordPayment = false,
  onRecordPayment,
  recordingPayment = false,
}) => {
  const [method, setMethod] = useState('wave');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!order) return;
    const first = order.methods?.[0]?.key || 'wave';
    setMethod(first);
    setAmount(order.balance > 0 ? String(order.balance) : '');
    setReference('');
    setFormError(null);
  }, [order?.id, order?.balance, order?.paid_amount]);

  if (!order) return null;

  const canTypePayment = canRecordPayment
    && order.channel !== 'boutique'
    && order.status !== 'annulée'
    && (order.balance ?? 0) > 0;

  const getStatusBadge = (status) => {
    const variants = {
      'en_attente': 'warning',
      'acceptée': 'success',
      'prête': 'info',
      'en_cours': 'primary',
      'disponible': 'success',
      'annulée': 'destructive'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getStatusColor = (status) => {
    const colors = {
      'en_attente': 'text-yellow-600 bg-yellow-50',
      'acceptée': 'text-green-600 bg-green-50',
      'prête': 'text-blue-600 bg-blue-50',
      'en_cours': 'text-purple-600 bg-purple-50',
      'disponible': 'text-green-600 bg-green-50',
      'annulée': 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg"
      title={`Détails de la commande - ${order.order_number}`}
      showCloseButton={true}
    >
      <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations client */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Informations client
              </h3>
              <div className="space-y-2">
                <p className="text-gray-900">
                  <span className="font-medium">Nom:</span> {order.client.name}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Téléphone:</span> {order.client.whatsapp_phone}
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContact(order.client, 'phone')}
                    className="flex-1"
                  >
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Appeler
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContact(order.client, 'whatsapp')}
                    className="flex-1"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            {/* Informations commande */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Informations commande
              </h3>
              <div className="space-y-2">
                <p className="text-gray-900">
                  <span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleString('fr-FR')}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Statut:</span> {getStatusBadge(order.status)}
                </p>
                {order.reservation && (
                  <p className="text-gray-900">
                    <span className="font-medium">Stock:</span>{' '}
                    {order.reservation.label}
                    {order.reservation.status === 'active' && order.reservation.expires_at && (
                      <span className="text-sm text-gray-500">
                        {' '}· expire le {new Date(order.reservation.expires_at).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </p>
                )}
                {order.preorder && (
                  <p className="text-gray-900">
                    <span className="font-medium">Précommande:</span>{' '}
                    {order.preorder.label}
                    {order.preorder.status === 'waiting' && order.preorder.units > 0 && (
                      <span className="text-sm text-gray-500"> · {order.preorder.units} pièce(s) en file</span>
                    )}
                  </p>
                )}
                <p className="text-gray-900">
                  <span className="font-medium">Total:</span> 
                  <span className="font-bold text-lg ml-2">{Math.round(Number(order.total_amount) || 0)} FCFA</span>
                </p>
                {order.payment_status && (
                  <p className="text-gray-900 flex items-center gap-2">
                    <span className="font-medium">Paiement:</span>
                    <Badge variant={paymentBadgeVariant[order.payment_status] || 'secondary'}>
                      {order.payment_status_label || order.payment_status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {order.paid_amount || 0} / {order.due_amount || Math.round(Number(order.total_amount) || 0)} FCFA
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {order.payment_status && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Paiements
              </h3>
              {order.payments?.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
                      <div>
                        <p className="font-medium text-gray-900">{payment.method_label}</p>
                        <p className="text-gray-500">
                          {payment.recorded_by || 'Caisse'}
                          {payment.reference ? ` · ${payment.reference}` : ''}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">{payment.amount} FCFA</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">Aucun paiement enregistré pour le moment.</p>
              )}

              {canTypePayment && (
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const value = parseInt(amount, 10);
                    if (!value || value < 1) {
                      setFormError('Indiquez le montant reçu');
                      return;
                    }
                    setFormError(null);
                    const result = await onRecordPayment?.(order.id, {
                      method,
                      amount: value,
                      reference: reference.trim() || undefined,
                    });
                    if (result && !result.success) {
                      setFormError(result.message || 'Paiement refusé');
                    }
                  }}
                >
                  <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                    {(order.methods || []).map((item) => (
                      <SelectOption key={item.key} value={item.key}>{item.label}</SelectOption>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Montant (FCFA)"
                  />
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Référence (Wave, dépôt…)"
                    className="md:col-span-2"
                  />
                  {formError && <p className="text-sm text-red-600 md:col-span-2">{formError}</p>}
                  <Button type="submit" variant="primary" disabled={recordingPayment} className="md:col-span-2">
                    {recordingPayment ? 'Enregistrement…' : 'Enregistrer le paiement'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Détails des produits */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Articles commandés</h3>
            </div>
            <div className="p-4">
              {order.items && order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                        {item.variant_name && (
                          <p className="text-sm text-gray-600 mt-1">
                            Variante: <span className="font-medium">{item.variant_name}</span>
                          </p>
                        )}
                        {item.product_description && (
                          <p className="text-sm text-gray-500 mt-1">{item.product_description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-600">Quantité</p>
                            <p className="font-semibold text-lg text-gray-900">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Prix unitaire</p>
                            <p className="font-semibold text-gray-900">{Math.round(Number(item.price) || 0)} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-bold text-lg text-blue-600">
                              {Math.round((Number(item.price) || 0) * (Number(item.quantity) || 0))} FCFA
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun détail de produit disponible</p>
                </div>
              )}

              {/* Résumé total */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>Nombre d'articles: {order.items_summary?.items_count || 0}</p>
                    <p>Quantité totale: {order.items_summary?.total_items || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total de la commande</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(Number(order.total_amount) || 0)} FCFA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions de statut */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Actions de gestion</h3>
            <div className="space-y-3">
              {order.status === 'en_attente' && (
                <div className="flex space-x-3">
                  <Button
                    variant="success"
                    onClick={() => onStatusChange(order.id, 'acceptée')}
                    disabled={updatingOrder === order.id || order.can_validate === false}
                    className="flex-1"
                  >
                    {updatingOrder === order.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <span>✓</span>
                    )}
                    Accepter la commande
                  </Button>
                  {canCancel && (
                  <Button
                    variant="destructive"
                    onClick={() => onStatusChange(order.id, 'annulée')}
                    disabled={updatingOrder === order.id}
                    className="flex-1"
                  >
                    {updatingOrder === order.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <span>✗</span>
                    )}
                    Annuler
                  </Button>
                  )}
                </div>
              )}
              {order.status === 'en_attente' && order.can_validate === false && (
                <p className="text-sm text-amber-700">
                  Acompte requis : {order.min_deposit_amount} FCFA ({order.min_deposit_percent} %)
                </p>
              )}

              {order.status === 'acceptée' && (
                <Button
                  variant="primary"
                  onClick={() => onStatusChange(order.id, 'prête')}
                  disabled={updatingOrder === order.id}
                  className="w-full"
                >
                  {updatingOrder === order.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span>📦</span>
                  )}
                  Marquer comme prête à livrer
                </Button>
              )}

              {order.status === 'prête' && (
                <Button
                  variant="primary"
                  onClick={() => onStatusChange(order.id, 'en_cours')}
                  disabled={updatingOrder === order.id}
                  className="w-full"
                >
                  {updatingOrder === order.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span>🚚</span>
                  )}
                  Mettre en cours de livraison
                </Button>
              )}

              {order.status === 'en_cours' && (
                <Button
                  variant="success"
                  onClick={() => onStatusChange(order.id, 'disponible')}
                  disabled={updatingOrder === order.id}
                  className="w-full"
                >
                  {updatingOrder === order.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span>🏢</span>
                  )}
                  Marquer comme disponible au bureau
                </Button>
              )}

              {(order.status === 'disponible' || order.status === 'annulée') && (
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    {order.status === 'disponible' 
                      ? 'Commande terminée - Disponible au bureau' 
                      : 'Commande annulée'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
       </div>
     </Modal>
  );
};

export default OrderDetailsModal;
