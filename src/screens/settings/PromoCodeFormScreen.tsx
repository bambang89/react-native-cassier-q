import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as promoApi from '@/api/promoCodesApi';
import { apiErrorMessage } from '@/api/errors';
import type { RootStackParamList } from '@/navigation/types';
import type { PromoCodePayload, PromoDiscountType } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { Button, FormControl, Input, Pressable, Switch } from '@/components/ui/forms';
import { AlertDialog } from '@/components/ui/overlay';
import { AppBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { CalendarIcon, TrendingIcon } from '@/components/icons/LineIcons';

import { generatePromoCode, promoSummary, rupiah } from './promoUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'PromoCodeForm'>;

const END_PRESETS: { label: string; days: number | null }[] = [
  { label: 'Tanpa batas', days: null },
  { label: '7 hari', days: 7 },
  { label: '14 hari', days: 14 },
  { label: '30 hari', days: 30 },
];

/** "dd/mm/yyyy" ↔ ISO helpers for the end-date field (end of that day, device time). */
const toDisplayDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const parseDisplayDate = (text: string): string | null | undefined => {
  if (!text.trim()) return null;
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return undefined;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 23, 59, 59);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/** Create or edit a promo code (store owner). */
export default function PromoCodeFormScreen({ navigation, route }: Props) {
  const editing = route.params?.promo;
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState(editing?.code ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [discountType, setDiscountType] = useState<PromoDiscountType>(editing?.discountType ?? 'PERCENT');
  const [discountValue, setDiscountValue] = useState(editing ? String(editing.discountValue) : '');
  const [maxDiscount, setMaxDiscount] = useState(editing?.maxDiscountAmount ? String(editing.maxDiscountAmount) : '');
  const [minPurchase, setMinPurchase] = useState(editing?.minPurchaseAmount ? String(editing.minPurchaseAmount) : '');
  const [usageLimit, setUsageLimit] = useState(editing?.usageLimit ? String(editing.usageLimit) : '');
  const [endDate, setEndDate] = useState(toDisplayDate(editing?.endsAt ?? null));
  const [active, setActive] = useState(editing?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const value = Number(discountValue || 0);
  const canSubmit = code.trim().length >= 3 && name.trim().length > 0 && value > 0;

  /** Sets the end date to N days from today, or clears it. */
  const applyEndPreset = (days: number | null) => {
    if (days === null) return setEndDate('');
    const d = new Date();
    d.setDate(d.getDate() + days);
    setEndDate(toDisplayDate(d.toISOString()));
  };

  /** Builds the API payload; returns null (after alerting) when a field is invalid. */
  const buildPayload = (): PromoCodePayload | null => {
    const endsAt = parseDisplayDate(endDate);
    if (endsAt === undefined) {
      Alert.alert('Tanggal tidak valid', 'Isi tanggal berakhir dengan format dd/mm/yyyy.');
      return null;
    }
    if (discountType === 'PERCENT' && value > 100) {
      Alert.alert('Diskon tidak valid', 'Diskon persen maksimal 100%.');
      return null;
    }
    return {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      discountType,
      discountValue: value,
      maxDiscountAmount: discountType === 'PERCENT' && maxDiscount ? Number(maxDiscount) : null,
      minPurchaseAmount: minPurchase ? Number(minPurchase) : null,
      startsAt: editing?.startsAt ?? null,
      endsAt,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      active,
    };
  };

  /** Creates or updates the promo, then returns to the list. */
  const onSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      if (editing) await promoApi.updatePromoCode(editing.id, payload);
      else await promoApi.createPromoCode(payload);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Kode promo tidak bisa disimpan.'));
    } finally {
      setSaving(false);
    }
  };

  /** Deletes the promo (the API deactivates it instead if it was already used). */
  const onDelete = async () => {
    if (!editing) return;
    try {
      await promoApi.deletePromoCode(editing.id);
      setConfirmDelete(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Kode promo tidak bisa dihapus.'));
    }
  };

  const preview = canSubmit
    ? promoSummary({
        id: '',
        code,
        name,
        discountType,
        discountValue: value,
        maxDiscountAmount: discountType === 'PERCENT' && maxDiscount ? Number(maxDiscount) : null,
        minPurchaseAmount: minPurchase ? Number(minPurchase) : null,
        startsAt: null,
        endsAt: null,
        usageLimit: null,
        usedCount: 0,
        active,
      })
    : null;

  const valueLabel =
    value > 0 ? (discountType === 'PERCENT' ? `${value}%` : rupiah(value)) : discountType === 'PERCENT' ? '0%' : 'Rp0';

  return (
    <View style={local.container}>
      <AppBar title={editing ? 'Ubah Kode Promo' : 'Kode Promo Baru'} onBack={navigation.goBack} />
      <KeyboardAvoidingView style={local.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={local.body} keyboardShouldPersistTaps="handled">
          {/* Pratinjau tiket */}
          <View style={local.ticket}>
            <View style={local.ticketMain}>
              <Text size="xs" weight="semibold" style={local.ticketLabel}>
                {name.trim() || 'NAMA PROMO'}
              </Text>
              <Text style={local.ticketValue}>{valueLabel}</Text>
              <Text size="xs" style={local.ticketDesc} numberOfLines={2}>
                {preview ?? 'Isi detail promo di bawah'}
              </Text>
            </View>
            <View style={local.ticketCut}>
              <View style={[local.notch, local.notchTop]} />
              <View style={local.cutLine} />
              <View style={[local.notch, local.notchBottom]} />
            </View>
            <View style={local.ticketSide}>
              <Text size="xs" style={local.ticketLabel}>
                KODE
              </Text>
              <Text style={local.ticketCode} numberOfLines={1} adjustsFontSizeToFit>
                {code.trim().toUpperCase() || '——'}
              </Text>
              <View style={[local.ticketStatus, active ? local.ticketStatusOn : local.ticketStatusOff]}>
                <Text size="xs" weight="semibold" style={local.ticketStatusText}>
                  {active ? 'Aktif' : 'Nonaktif'}
                </Text>
              </View>
            </View>
          </View>

          {/* Identitas */}
          <SectionCard title="Identitas promo">
            <FormControl label="Nama promo" isRequired>
              <Input value={name} onChangeText={setName} placeholder="Mis. Promo Akhir Pekan" maxLength={120} />
            </FormControl>
            <FormControl label="Kode promo" isRequired helperText="3–30 huruf/angka tanpa spasi. Tekan Buat Otomatis untuk kode acak.">
              <Input
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={30}
                placeholder="HEMAT10"
                rightElement={
                  <Pressable
                    onPress={() => setCode(generatePromoCode(name, discountType, value))}
                    hitSlop={8}
                    style={local.autoButton}
                    accessibilityRole="button"
                    accessibilityLabel="Buat kode promo otomatis"
                  >
                    <TrendingIcon size={13} color={colors.primary[600]} />
                    <Text size="xs" weight="bold" style={local.autoText}>
                      Buat Otomatis
                    </Text>
                  </Pressable>
                }
              />
            </FormControl>
          </SectionCard>

          {/* Nilai diskon */}
          <SectionCard title="Nilai diskon">
            <View style={local.segment}>
              {(['PERCENT', 'AMOUNT'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setDiscountType(type)}
                  style={[local.segmentItem, discountType === type && local.segmentItemActive]}
                >
                  <Text size="sm" weight="semibold" style={discountType === type ? local.segmentTextActive : local.segmentText}>
                    {type === 'PERCENT' ? 'Persen (%)' : 'Nominal (Rp)'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={local.row}>
              <View style={local.half}>
                <FormControl label={discountType === 'PERCENT' ? 'Diskon (%)' : 'Potongan (Rp)'} isRequired>
                  <Input
                    value={discountValue}
                    onChangeText={(v) => setDiscountValue(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder={discountType === 'PERCENT' ? '10' : '20000'}
                  />
                </FormControl>
              </View>
              {discountType === 'PERCENT' ? (
                <View style={local.half}>
                  <FormControl label="Maks. potongan (Rp)">
                    <Input
                      value={maxDiscount}
                      onChangeText={(v) => setMaxDiscount(v.replace(/\D/g, ''))}
                      keyboardType="number-pad"
                      placeholder="Opsional"
                    />
                  </FormControl>
                </View>
              ) : null}
            </View>
          </SectionCard>

          {/* Ketentuan */}
          <SectionCard title="Ketentuan pemakaian">
            <View style={local.row}>
              <View style={local.half}>
                <FormControl label="Min. belanja (Rp)">
                  <Input
                    value={minPurchase}
                    onChangeText={(v) => setMinPurchase(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    placeholder="Opsional"
                  />
                </FormControl>
              </View>
              <View style={local.half}>
                <FormControl label="Kuota pemakaian">
                  <Input
                    value={usageLimit}
                    onChangeText={(v) => setUsageLimit(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    placeholder="Tanpa batas"
                  />
                </FormControl>
              </View>
            </View>
            {editing ? (
              <Text size="xs" color="muted">
                Sudah dipakai {editing.usedCount} kali{editing.usageLimit ? ` dari ${editing.usageLimit}` : ''}.
              </Text>
            ) : null}
          </SectionCard>

          {/* Masa berlaku */}
          <SectionCard title="Masa berlaku">
            <FormControl label="Berlaku sampai" helperText="Format dd/mm/yyyy. Kosongkan bila tanpa batas waktu.">
              <Input
                value={endDate}
                onChangeText={setEndDate}
                placeholder="Tanpa batas"
                keyboardType="numbers-and-punctuation"
                leftElement={<CalendarIcon size={16} color={colors.text.muted} />}
              />
            </FormControl>
            <View style={local.presets}>
              {END_PRESETS.map((preset) => {
                const selected =
                  preset.days === null ? !endDate : endDate === toDisplayDate(daysFromNow(preset.days));
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => applyEndPreset(preset.days)}
                    style={[local.presetChip, selected && local.presetChipActive]}
                  >
                    <Text size="xs" weight="semibold" style={selected ? local.presetTextActive : local.presetText}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={local.activeRow}>
              <View style={local.flex}>
                <Text weight="semibold">Aktifkan promo</Text>
                <Text size="xs" color="muted">
                  Kasir hanya bisa memakai kode yang aktif
                </Text>
              </View>
              <Switch value={active} onValueChange={setActive} />
            </View>
          </SectionCard>

          {editing ? (
            <Button variant="dangerOutline" onPress={() => setConfirmDelete(true)} style={local.delete}>
              Hapus Kode Promo
            </Button>
          ) : null}
        </ScrollView>

        <View style={[local.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button fullWidth onPress={onSave} loading={saving} disabled={!canSubmit || saving}>
            {editing ? 'Simpan Perubahan' : 'Buat Kode Promo'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <AlertDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus kode promo?"
        description={`"${editing?.code}" tidak bisa dipakai lagi. Bila sudah pernah dipakai, kode hanya dinonaktifkan agar riwayat transaksi tetap utuh.`}
        confirmText="Hapus"
        isDanger
        onConfirm={onDelete}
      />
    </View>
  );
}

/** White card with a small uppercase title that groups related promo fields. */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={local.section}>
      <Text size="xs" weight="semibold" color="muted" style={local.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      <View style={local.card}>{children}</View>
    </View>
  );
}

/** ISO date N days from now (used to highlight the selected end-date preset). */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  body: { padding: spacing.base, paddingBottom: spacing.xl, gap: spacing.lg },
  ticket: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    backgroundColor: colors.darkBg,
    overflow: 'hidden',
  },
  ticketMain: { flex: 1, padding: spacing.lg, gap: 2 },
  ticketLabel: { color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' },
  ticketValue: { color: colors.white, fontSize: 30, lineHeight: 36, fontWeight: '800' },
  ticketDesc: { color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  ticketCut: { width: 18, alignItems: 'center' },
  notch: { width: 18, height: 9, backgroundColor: colors.canvas },
  notchTop: { borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  notchBottom: { borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  cutLine: {
    flex: 1,
    width: 0,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ticketSide: { width: 120, padding: spacing.md, justifyContent: 'center', gap: 4 },
  ticketCode: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  ticketStatus: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 9999 },
  ticketStatusOn: { backgroundColor: 'rgba(16,185,129,0.25)' },
  ticketStatusOff: { backgroundColor: 'rgba(255,255,255,0.12)' },
  ticketStatusText: { color: colors.white },
  section: { gap: spacing.sm },
  sectionTitle: { letterSpacing: 0.8, marginLeft: spacing.xs },
  card: {
    padding: spacing.base,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  autoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: colors.primary[50],
  },
  autoText: { color: colors.primary[600] },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.lg,
    backgroundColor: colors.gray[100],
    marginBottom: spacing.base,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.md },
  segmentItemActive: { backgroundColor: colors.background, shadowColor: '#0B1F33', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { color: colors.text.secondary },
  segmentTextActive: { color: colors.primary[700] },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  presetChipActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  presetText: { color: colors.text.secondary },
  presetTextActive: { color: colors.primary[700] },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  delete: { marginTop: spacing.xs },
  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
