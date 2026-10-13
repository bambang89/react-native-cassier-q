import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as inventoryApi from '@/api/inventoryApi';
import * as productsApi from '@/api/productsApi';
import type { ProductPhotoFile } from '@/api/productsApi';
import { apiErrorMessage } from '@/api/errors';
import { choosePhoto } from '@/services/photos/pickPhoto';
import type { RootStackParamList } from '@/navigation/types';
import type { BadStockReason, ProductUnit, StockItem } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { Button, Pressable } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { AppBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { SearchIcon } from '@/components/icons/LineIcons';

import { qty, REASONS, rupiah } from './inventoryLabels';

type Props = NativeStackScreenProps<RootStackParamList, 'BadStockForm'>;

/** Report damaged, expired, lost, defective or customer-returned goods, with an optional photo. */
export default function BadStockFormScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [catalog, setCatalog] = useState<StockItem[]>([]);
  const [product, setProduct] = useState<StockItem | null>(null);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [unit, setUnit] = useState<ProductUnit | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<BadStockReason>('DAMAGED');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<ProductPhotoFile | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    inventoryApi.fetchStock().then((s) => setCatalog(s.items)).catch(() => setCatalog([]));
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((p) => !q || p.productName.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 40);
  }, [catalog, search]);

  const amount = Number(quantity || 0);
  const baseAmount = amount * (unit?.conversionToBase ?? 1);
  const lossValue = product?.costPrice ? baseAmount * product.costPrice : null;
  const canSubmit = !!product && !!unit && amount > 0 && baseAmount <= (product?.stock ?? 0);

  /** Picks the product and loads its units (base unit preselected). */
  const pickProduct = async (item: StockItem) => {
    setPickerOpen(false);
    setSearch('');
    setProduct(item);
    const list = await productsApi.fetchProductUnits(item.productId).catch(() => []);
    setUnits(list);
    setUnit(list.find((u) => u.baseUnit) ?? list[0] ?? null);
  };

  /** Sends the report, then uploads the photo if one was taken. */
  const submit = async () => {
    if (!product || !unit) return;
    setSaving(true);
    try {
      const saved = await inventoryApi.reportBadStock({
        productId: product.productId,
        unitId: unit.unitId,
        quantity: amount,
        reason,
        notes: notes.trim() || undefined,
      });
      if (photo) {
        try {
          await inventoryApi.uploadBadStockPhoto(saved.id, photo);
        } catch (error) {
          Alert.alert('Foto belum tersimpan', apiErrorMessage(error, 'Laporan tersimpan, tetapi foto gagal diunggah.'));
        }
      }
      Alert.alert(
        'Bad stock tercatat',
        saved.status === 'PENDING'
          ? 'Laporan menunggu persetujuan Kepala Toko. Stok dikurangi setelah disetujui.'
          : 'Stok sudah dikurangi dan barang dipisahkan.',
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Bad stock tidak bisa dicatat.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Catat Bad Stock" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text size="xs" weight="semibold" color="muted" style={styles.label}>
          PRODUK
        </Text>
        <Pressable onPress={() => setPickerOpen(true)} style={styles.card}>
          {product ? (
            <View>
              <Text weight="semibold">{product.productName}</Text>
              <Text size="xs" color="muted">
                Stok saat ini {qty(product.stock)} {product.baseUnitName}
              </Text>
            </View>
          ) : (
            <Text color="muted">Pilih produk…</Text>
          )}
        </Pressable>

        {product ? (
          <>
            <Text size="xs" weight="semibold" color="muted" style={styles.label}>
              JUMLAH
            </Text>
            <View style={[styles.card, styles.row]}>
              <TextInput
                value={quantity}
                onChangeText={(v) => setQuantity(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                style={styles.qtyInput}
              />
              <View style={styles.chips}>
                {units.map((u) => {
                  const active = u.unitId === unit?.unitId;
                  return (
                    <Pressable key={u.unitId} onPress={() => setUnit(u)} style={[styles.chip, active && styles.chipActive]}>
                      <Text size="xs" weight="semibold" style={active ? styles.chipTextActive : styles.chipText}>
                        {u.unitName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {baseAmount > product.stock ? (
              <Text size="xs" color="error">
                Melebihi stok yang ada ({qty(product.stock)} {product.baseUnitName}).
              </Text>
            ) : lossValue !== null ? (
              <Text size="xs" color="muted">
                Perkiraan kerugian {rupiah(lossValue)} (harga modal)
              </Text>
            ) : null}
          </>
        ) : null}

        <Text size="xs" weight="semibold" color="muted" style={styles.label}>
          ALASAN
        </Text>
        <View style={styles.reasonGrid}>
          {REASONS.map((r) => {
            const active = r.value === reason;
            return (
              <Pressable key={r.value} onPress={() => setReason(r.value)} style={[styles.reason, active && styles.reasonActive]}>
                <Text size="lg">{r.emoji}</Text>
                <Text size="xs" weight="semibold" style={active ? styles.reasonTextActive : styles.chipText}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text size="xs" weight="semibold" color="muted" style={styles.label}>
          CATATAN & FOTO BUKTI (OPSIONAL)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Mis. kemasan sobek saat bongkar muat"
          placeholderTextColor={colors.gray[400]}
          multiline
          maxLength={500}
          style={[styles.card, styles.notes]}
        />
        <Pressable onPress={() => choosePhoto(setPhoto, { title: 'Foto bukti', onRemove: photo ? () => setPhoto(null) : undefined })} style={styles.photo}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
          ) : (
            <Text size="sm" color="muted">
              📷 Tambah foto bukti
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button fullWidth onPress={submit} loading={saving} disabled={!canSubmit || saving}>
          Catat Bad Stock
        </Button>
      </View>

      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text weight="bold" size="lg" style={{ marginBottom: spacing.md }}>
          Pilih produk
        </Text>
        <View style={styles.searchBox}>
          <SearchIcon size={16} color={colors.text.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama atau SKU"
            placeholderTextColor={colors.gray[400]}
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>
        <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
          {results.map((p) => (
            <Pressable key={p.productId} onPress={() => pickProduct(p)} style={styles.pickerRow}>
              <View style={{ flex: 1 }}>
                <Text weight="semibold" numberOfLines={1}>
                  {p.productName}
                </Text>
                <Text size="xs" color="muted">
                  {p.sku} · stok {qty(p.stock)} {p.baseUnitName}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  body: { padding: spacing.base, paddingBottom: spacing.xl, gap: spacing.sm },
  label: { letterSpacing: 0.8, marginTop: spacing.sm },
  card: { padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyInput: {
    width: 80,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { color: colors.text.secondary },
  chipTextActive: { color: colors.white },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reason: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  reasonActive: { borderColor: colors.warning[500], backgroundColor: colors.warning[50] },
  reasonTextActive: { color: colors.warning[700] },
  notes: { minHeight: 70, textAlignVertical: 'top', fontSize: 14, color: colors.text.primary },
  photo: {
    height: 140,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  photoImage: { width: '100%', height: '100%' },
  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text.primary },
  pickerRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
});
