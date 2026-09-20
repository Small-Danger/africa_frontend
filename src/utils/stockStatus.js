export const STOCK_STATE = {
  EN_STOCK: 'en_stock',
  SUR_COMMANDE: 'sur_commande',
  RUPTURE: 'rupture',
};

export function stockDotClass(state) {
  if (state === STOCK_STATE.RUPTURE) return 'bg-red-500';
  if (state === STOCK_STATE.SUR_COMMANDE) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function stockTextClass(state) {
  if (state === STOCK_STATE.RUPTURE) return 'text-red-600';
  if (state === STOCK_STATE.SUR_COMMANDE) return 'text-amber-700';
  return 'text-gray-600';
}

export function stockBadgeVariant(state, needsInventory = false) {
  if (state === STOCK_STATE.RUPTURE) return 'danger';
  if (state === STOCK_STATE.SUR_COMMANDE) return 'warning';
  if (needsInventory) return 'info';
  return 'success';
}

export function displayStockQuantity(item) {
  if (item?.needs_inventory) return 'À inventorier';
  if (item?.stock_quantity == null) return null;
  return item.stock_quantity;
}
