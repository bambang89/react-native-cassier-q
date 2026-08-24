import { ScrollView, View } from 'react-native';

import { Button, Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { VStack } from '@/components/ui/layout';
import { CartIcon, ClockIcon, DiscountIcon, NoteIcon, TrashIcon } from '@/components/icons/LineIcons';
import { tabletColors } from '@/theme/tabletColors';
import type { CartItem } from '@/types/models';

import { styles } from '../POSScreen.styles';
import { formatRupiah } from '../POSScreen.utils';
import { CartItemRow } from './CartItemRow';

export function OrderPanel({
  cashierName,
  cartItems,
  cartCount,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  canCheckout,
  onCheckout,
  onClearCart,
  onOpenDiscount,
  onHold,
  onAddNote,
}: {
  cashierName: string;
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  canCheckout: boolean;
  onCheckout: () => void;
  onClearCart: () => void;
  onOpenDiscount: () => void;
  onHold: () => void;
  onAddNote: () => void;
}) {
  // OrderPanel cuma pernah dirender di mode tablet (lihat pemanggilnya di
  // POSScreen), jadi semua warnanya boleh langsung pakai tabletColors persis
  // .tpos-right/.cart-item/.summary-row di tablet-pos.html, tanpa ternary.
  return (
    <VStack style={styles.sidePanelInner}>
      <View style={styles.sidePanelHeader}>
        <View style={styles.sidePanelHeaderText}>
          <Text style={styles.sidePanelTitleTablet}>Pesanan Saat Ini</Text>
          <Text style={styles.sidePanelMetaTablet}>
            {cartCount} item · Kasir: {cashierName}
          </Text>
        </View>
        {cartCount > 0 ? (
          <Pressable style={styles.clearIconButton} onPress={onClearCart} accessibilityLabel="Hapus keranjang">
            <TrashIcon size={15} color={tabletColors.gray600} />
          </Pressable>
        ) : null}
      </View>

      {cartItems.length > 0 ? (
        <ScrollView style={styles.sidePanelList} showsVerticalScrollIndicator={false}>
          {cartItems.map((item) => (
            <CartItemRow key={`${item.product.id}-${item.unitId}`} item={item} tablet />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.sidePanelEmpty}>
          <View style={styles.sidePanelEmptyGlyph}>
            <CartIcon size={22} color={tabletColors.blue600} />
          </View>
          <Text color="muted" size="sm" style={styles.sidePanelEmptyText}>
            Belum ada item, ketuk produk untuk menambahkan.
          </Text>
        </View>
      )}

      <View style={styles.summaryDividerTablet} />

      <View style={styles.summaryRowTablet}>
        <Text style={styles.summaryLabelTablet}>Subtotal</Text>
        <Text style={styles.summaryValueTablet}>{formatRupiah(subtotal)}</Text>
      </View>
      {discountAmount > 0 ? (
        <View style={styles.summaryRowTablet}>
          <Text style={styles.summaryLabelTablet}>Diskon</Text>
          <Text style={[styles.summaryValueTablet, { color: tabletColors.emerald600 }]}>
            − {formatRupiah(discountAmount)}
          </Text>
        </View>
      ) : null}
      {taxAmount > 0 ? (
        <View style={styles.summaryRowTablet}>
          <Text style={styles.summaryLabelTablet}>Pajak (11%)</Text>
          <Text style={styles.summaryValueTablet}>{formatRupiah(taxAmount)}</Text>
        </View>
      ) : null}

      <View style={styles.totalRowTablet}>
        <Text style={styles.totalLabelTablet}>Total</Text>
        <Text style={styles.totalValueTablet}>{formatRupiah(grandTotal)}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButtonTablet} onPress={onHold}>
          <ClockIcon size={14} color={tabletColors.gray700} />
          <Text style={styles.actionButtonLabelTablet}>Tahan</Text>
        </Pressable>
        <Pressable style={styles.actionButtonTablet} onPress={onOpenDiscount}>
          <DiscountIcon size={14} color={tabletColors.gray700} />
          <Text style={styles.actionButtonLabelTablet}>Diskon</Text>
        </Pressable>
        <Pressable style={styles.actionButtonTablet} onPress={onAddNote}>
          <NoteIcon size={14} color={tabletColors.gray700} />
          <Text style={styles.actionButtonLabelTablet}>Catatan</Text>
        </Pressable>
      </View>

      <Button
        fullWidth
        disabled={!canCheckout}
        onPress={onCheckout}
        style={[styles.payButton, styles.payButtonTablet]}
      >
        {`Bayar Sekarang · ${formatRupiah(grandTotal)}`}
      </Button>
    </VStack>
  );
}
