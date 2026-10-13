import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearReceipt, fetchReceipt } from '@/store/slices/ordersSlice';
import type { RootStackParamList } from '@/navigation/types';
import { formatReceiptText, paymentMethodLabel } from '@/utils/receiptText';
import type { Receipt } from '@/types/models';
import { getPaperWidth, getPrinter, getPrinterConfig, PAPER_CHARS, savePaperWidth, saveReceiptText } from '@/services/printing';
import type { PaperWidth } from '@/services/printing';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radii, shadows, spacing } from '@/theme';
import { Button } from '@/components/ui/forms';
import { AppBar } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';
import { FolderIcon, PrintIcon } from '@/components/icons/LineIcons';
import { PaperWidthPicker } from '@/components/printing';
import { formatRupiah } from '@/screens/pos/POSScreen.utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Receipt'>;

/** Max on-screen width of the paper preview, roughly proportional to 58mm : 80mm. */
const PAPER_MAX_WIDTH: Record<PaperWidth, number> = { 58: 340, 80: 460 };
const TABLET_PANEL_WIDTH = 340;

/**
 * Receipt screen shown after checkout or from order history.
 * Phone: paper preview with actions below. Tablet: preview on the left, summary and actions panel on the right.
 */
export default function ReceiptScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const receipt = useAppSelector((state) => state.orders.receipt);
  const receiptStatus = useAppSelector((state) => state.orders.receiptStatus);

  useEffect(() => {
    dispatch(fetchReceipt(orderId));
    return () => {
      dispatch(clearReceipt());
    };
  }, [dispatch, orderId]);

  const { width: screenWidth, isTablet } = useResponsive();
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(58);

  useEffect(() => {
    getPaperWidth().then(setPaperWidth);
  }, []);

  /** Switches the paper width for the preview and persists it for printing. */
  const onChangePaperWidth = (width: PaperWidth) => {
    setPaperWidth(width);
    savePaperWidth(width);
  };

  const chars = PAPER_CHARS[paperWidth];
  const receiptText = receipt ? formatReceiptText(receipt, chars) : '';
  const previewArea = isTablet ? screenWidth - TABLET_PANEL_WIDTH - spacing.xl * 2 : screenWidth - spacing.base * 2;
  const paperPreviewWidth = Math.min(previewArea, PAPER_MAX_WIDTH[paperWidth]);

  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Shares the plain-text receipt through the OS share sheet. */
  const onShare = async () => {
    if (!receipt) return;
    try {
      await Share.share({ message: receiptText });
    } catch {
      // User batal share atau share sheet gagal dibuka — tidak perlu ditampilkan sebagai error.
    }
  };

  /** Prints the receipt with the configured printer (falls back to the system share sheet). */
  const onPrint = async () => {
    if (!receipt) return;
    setPrinting(true);
    try {
      const config = await getPrinterConfig();
      await getPrinter(config?.type ?? 'SYSTEM').print(receipt);
    } catch (error) {
      Alert.alert('Gagal mencetak', error instanceof Error ? error.message : 'Terjadi kesalahan saat mencetak struk.');
    } finally {
      setPrinting(false);
    }
  };

  /** Saves the plain-text receipt, e.g. to Files or a cloud drive. */
  const onSaveReceipt = async () => {
    if (!receipt) return;
    setSaving(true);
    try {
      await saveReceiptText(receipt);
    } catch {
      // User batal share atau share sheet gagal dibuka — tidak perlu ditampilkan sebagai error.
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Struk" onBack={navigation.goBack} />

      {!receipt ? (
        <View style={styles.center}>
          <ActivityIndicator />
          {receiptStatus === 'failed' ? (
            <Text color="error" style={styles.errorText}>
              Struk tidak ditemukan.
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.content, isTablet && styles.contentTablet]}>
          <ScrollView style={styles.previewScroll} contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]}>
            <ReceiptPaper receipt={receipt} width={paperPreviewWidth} />
          </ScrollView>

          {isTablet ? (
            <View style={styles.panel}>
              <Text size="sm" color={receipt.status === 'VOID' ? 'error' : 'muted'}>
                {receipt.status === 'VOID' ? 'Transaksi dibatalkan' : 'Total pembayaran'}
              </Text>
              <Heading level="h1" style={styles.panelTotal}>
                {formatRupiah(receipt.grandTotal)}
              </Heading>
              <Text size="sm" color="secondary">
                {receipt.transactionNumber} · {paymentMethodLabel(receipt.paymentMethod)}
              </Text>
              {receipt.changeAmount > 0 ? (
                <Text size="sm" color="secondary">
                  Kembalian {formatRupiah(receipt.changeAmount)}
                </Text>
              ) : null}

              <Text weight="semibold" size="sm" style={styles.panelLabel}>
                Ukuran kertas
              </Text>
              <PaperWidthPicker value={paperWidth} onChange={onChangePaperWidth} />

              <View style={styles.panelActions}>
                <Button
                  leftIcon={<PrintIcon size={16} color={colors.white} />}
                  loading={printing}
                  onPress={onPrint}
                >
                  Cetak Struk
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<FolderIcon size={16} color={colors.primary[600]} />}
                  loading={saving}
                  onPress={onSaveReceipt}
                >
                  Simpan
                </Button>
                <Button variant="outline" onPress={onShare}>
                  Bagikan
                </Button>
                <Button variant="ghost" onPress={() => navigation.navigate('Main', { screen: 'POS' })}>
                  Selesai
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.actions}>
              <PaperWidthPicker value={paperWidth} onChange={onChangePaperWidth} />
              <View style={styles.actionRow}>
                <Button
                  variant="outline"
                  style={styles.action}
                  onPress={() => navigation.navigate('Main', { screen: 'POS' })}
                >
                  Selesai
                </Button>
                <Button
                  variant="outline"
                  style={styles.action}
                  leftIcon={<PrintIcon size={16} color={colors.primary[600]} />}
                  loading={printing}
                  onPress={onPrint}
                >
                  Cetak
                </Button>
              </View>
              <View style={styles.actionRow}>
                <Button
                  variant="outline"
                  style={styles.action}
                  leftIcon={<FolderIcon size={16} color={colors.primary[600]} />}
                  loading={saving}
                  onPress={onSaveReceipt}
                >
                  Simpan
                </Button>
                <Button style={styles.action} onPress={onShare}>
                  Bagikan
                </Button>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Dashed horizontal separator, like the cut lines on a printed receipt.
 * iOS cannot draw a dashed border on a single side, so a fully bordered box is clipped down to its top edge.
 */
function DashedDivider() {
  return (
    <View style={styles.dashedClip}>
      <View style={styles.dashed} />
    </View>
  );
}

/** Label/value row for transaction details (number, date, cashier, customer). */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pairRow}>
      <Text size="xs">
        {label}
      </Text>
      <Text size="xs" weight="semibold" style={styles.pairValue}>
        {value}
      </Text>
    </View>
  );
}

/** Label/amount row for the payment summary (subtotal, discount, tax, payment, change). */
function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pairRow}>
      <Text size="sm">
        {label}
      </Text>
      <Text size="sm" weight="semibold">
        {value}
      </Text>
    </View>
  );
}

/**
 * On-screen receipt preview: a structured, monochrome layout that is easier to read than monospace text.
 * Its width follows the selected paper size; printed output still comes from `buildReceiptRows` / `formatReceiptText`.
 */
function ReceiptPaper({ receipt, width }: { receipt: Receipt; width: number }) {
  const isVoid = receipt.status === 'VOID';
  const itemCount = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
  const date = new Date(receipt.transactionDate).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.paper, { width }]}>
      <View style={styles.storeBlock}>
        <Heading level="h4" align="center">
          {receipt.storeName ?? 'cassier-Q'}
        </Heading>
        {receipt.storeAddress ? (
          <Text size="xs" align="center">
            {receipt.storeAddress}
          </Text>
        ) : null}
        {receipt.storePhone ? (
          <Text size="xs" align="center">
            Telp. {receipt.storePhone}
          </Text>
        ) : null}
      </View>

      {isVoid ? (
        <View style={styles.voidBadge}>
          <Text size="xs" weight="bold" align="center">
            TRANSAKSI DIBATALKAN
          </Text>
        </View>
      ) : null}

      <DashedDivider />

      <View style={styles.section}>
        <InfoRow label="No. Transaksi" value={receipt.transactionNumber} />
        <InfoRow label="Tanggal" value={date} />
        <InfoRow label="Kasir" value={receipt.cashierName} />
        {receipt.customerName ? <InfoRow label="Pelanggan" value={receipt.customerName} /> : null}
      </View>

      <DashedDivider />

      <View style={styles.section}>
        <Text size="xs" weight="semibold" style={styles.sectionTitle}>
          {receipt.items.length} PRODUK · {itemCount} ITEM
        </Text>
        {receipt.items.map((item, index) => (
          <View key={`${item.productName}-${index}`} style={styles.item}>
            <Text size="sm" weight="semibold">
              {item.productName}
            </Text>
            <View style={styles.pairRow}>
              <Text size="xs">
                {item.quantity} {item.unitName} × {formatRupiah(item.unitPrice)}
              </Text>
              <Text size="sm" weight="semibold">
                {formatRupiah(item.subtotal)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <DashedDivider />

      <View style={styles.section}>
        <AmountRow label="Subtotal" value={formatRupiah(receipt.subtotal)} />
        {receipt.discountAmount > 0 ? (
          <AmountRow label="Diskon" value={`-${formatRupiah(receipt.discountAmount)}`} />
        ) : null}
        {receipt.taxAmount > 0 ? <AmountRow label="Pajak" value={formatRupiah(receipt.taxAmount)} /> : null}
      </View>

      <View style={styles.totalRow}>
        <Text weight="bold">TOTAL</Text>
        <Text weight="bold">
          {formatRupiah(receipt.grandTotal)}
        </Text>
      </View>

      <View style={styles.section}>
        <AmountRow
          label={`Bayar (${paymentMethodLabel(receipt.paymentMethod)})`}
          value={formatRupiah(receipt.paymentAmount)}
        />
        <AmountRow label="Kembalian" value={formatRupiah(receipt.changeAmount)} />
        {receipt.debtAmount && receipt.debtAmount > 0 ? (
          <AmountRow label="Sisa Utang" value={formatRupiah(receipt.debtAmount)} />
        ) : null}
      </View>

      <DashedDivider />

      <Text size="sm" weight="semibold" align="center">
        {isVoid ? 'Struk ini tidak berlaku' : 'Terima kasih!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { marginTop: spacing.sm },
  content: { flex: 1 },
  contentTablet: { flexDirection: 'row' },
  previewScroll: { flex: 1 },
  body: { padding: spacing.base, alignItems: 'center' },
  bodyTablet: { padding: spacing.xl },
  paper: {
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    ...shadows.md,
  },
  storeBlock: { gap: 2 },
  voidBadge: {
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.black,
  },
  dashedClip: { height: 1, overflow: 'hidden' },
  dashed: {
    height: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.black,
  },
  section: { gap: spacing.xs },
  sectionTitle: { letterSpacing: 0.5, marginBottom: 2 },
  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  pairValue: { flexShrink: 1, textAlign: 'right' },
  item: { gap: 2, paddingVertical: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  actions: {
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  panel: {
    width: TABLET_PANEL_WIDTH,
    padding: spacing.xl,
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  panelTotal: { marginVertical: spacing.xs },
  panelLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  panelActions: { marginTop: spacing.xl, gap: spacing.sm },
});
