import { useAppSelector } from '@/store/hooks';

// Action permissions per menu, set by Kepala Toko in "Hak Akses Menu" (sub menu per role).
// The API enforces the same rules (@actionAccess); this hook only hides buttons the
// API would reject. Kepala Toko / Superadmin get every action (allowedActions = null).

export interface Permissions {
  /** True when the user may perform an action, e.g. can('products.create'). */
  can: (action: string) => boolean;
  canCreateProduct: boolean;
  canUpdateProduct: boolean;
  canDeleteProduct: boolean;
  /** Any product change (kept for screens that only need a yes/no). */
  canManageProducts: boolean;
  canRestock: boolean;
}

/** Action permissions of the logged-in user in the active store. */
export function usePermissions(): Permissions {
  const allowed = useAppSelector((state) => state.access.allowedActions);
  const can = (action: string) => allowed === null || allowed.includes(action);
  const canCreateProduct = can('products.create');
  const canUpdateProduct = can('products.update');
  const canDeleteProduct = can('products.delete');
  return {
    can,
    canCreateProduct,
    canUpdateProduct,
    canDeleteProduct,
    canManageProducts: canCreateProduct || canUpdateProduct || canDeleteProduct,
    canRestock: can('inventory.restock'),
  };
}
