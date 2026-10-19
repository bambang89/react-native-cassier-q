import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as inventoryApi from '@/api/inventoryApi';
import * as suppliersApi from '@/api/suppliersApi';
import { apiErrorMessage } from '@/api/errors';
import { useAppSelector } from '@/store/hooks';
import { usePermissions } from '@/hooks/usePermissions';
import { useMenuAccess } from '@/navigation/menuCatalog';
import type { RootStackParamList } from '@/navigation/types';
import type { BadStockItem, BadStockReport, BadStockStatus, Supplier } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { Modal } from '@/components/ui/overlay';
import { Button, Pressable, Switch } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { AlertTriangleIcon, CheckIcon, PlusIcon, TruckIcon } from '@/components/icons/LineIcons';

import { BS_STATUS, dateTime, qty, reasonLabel, REASONS, rupiah } from '../inventoryLabels';
import { FilterChips, HeroCard, styles } from './shared';

type Filter = 'ALL' | BadStockStatus;

/** Start and end of the current month as ISO strings. */
const thisMonth = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
  };
};

/** Bad stock: month loss summary, approval setting, reports with their follow-up actions. */
export function BadStockTab() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { can } = usePermissions();
  const { isManager } = useMenuAccess();
  const user = useAppSelector((state) => state.auth.user);
  const isKepalaToko = !!user?.roles.some((r) => r.roleCode === 'KEPALA_TOKO');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [items, setItems] = useState<BadStockItem[]>([]);
  const [report, setReport] = useState<BadStockReport | null>(null);
  const [requireApproval, setRequireApproval] = useState(true);
  const [loading, setLoading] = useState(true);
  const [returnTarget, setReturnTarget] = useState<BadStockItem | null>(null);

  /** Loads reports, this month's loss report and the approval setting. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = thisMonth();
      const [list, monthReport, settings] = await Promise.all([
        inventoryApi.fetchBadStock(),
        inventoryApi.fetchBadStockReport(from, to),
        inventoryApi.fetchBadStockSettings(),
      ]);
      setItems(list);
      setReport(monthReport);
      setRequireApproval(settings.requireApproval);
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Data bad stock gagal dimuat.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  /** Turns the store head approval step on or off. */
  const toggleApproval = async (value: boolean) => {
    setRequireApproval(value);
    try {
      await inventoryApi.updateBadStockSettings(value);
    } catch (error) {
      setRequireApproval(!value);
      Alert.alert('Gagal', apiErrorMessage(error, 'Pengaturan tidak bisa disimpan.'));
    }
  };

  /** Runs one follow-up action on a report and refreshes. */
  const act = async (item: BadStockItem, action: 'approve' | 'return' | 'dispose' | 'cancel') => {
    try {
      await inventoryApi.actOnBadStock(item.id, action);
      load();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Tindakan tidak bisa diproses.'));
    }
  };

  /** Shows the follow-up actions the user may take for a report. */
  const openActions = (item: BadStockItem) => {
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (item.status === 'PENDING' && isManager) {
      buttons.push({ text: 'Setujui (kurangi stok)', onPress: () => act(item, 'approve') });
      buttons.push({ text: 'Tolak', style: 'destructive', onPress: () => act(item, 'cancel') });
    }
    if (item.status === 'QUARANTINED') {
      if (can('inventory.bad_stock_resolve')) {
        buttons.push({ text: 'Sudah diretur ke supplier', onPress: () => setReturnTarget(item) });
        buttons.push({ text: 'Sudah dimusnahkan', onPress: () => act(item, 'dispose') });
      }
      if (isManager) {
        buttons.push({ text: 'Batalkan (kembalikan stok)', style: 'destructive', onPress: () => act(item, 'cancel') });
      }
    }
    if (buttons.length === 0) return;
    Alert.alert(item.productName, `${qty(item.quantity)} ${item.unitName} · ${reasonLabel(item.reason)}`, [
      ...buttons,
      { text: 'Tutup', style: 'cancel' },
    ]);
  };

  const visible = filter === 'ALL' ? items : items.filter((i) => i.status === filter);
  const countOf = (status: BadStockStatus) => items.filter((i) => i.status === status).length;

  return (
    <>
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      refreshing={loading}
      onRefresh={load}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <HeroCard title="KERUGIAN BAD STOCK BULAN INI" value={rupiah(report?.totalValue ?? 0)}>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {report?.records ?? 0} laporan
              {report?.byReason.length
                ? ` · terbanyak: ${reasonLabel(report.byReason[0].reason)} (${rupiah(report.byReason[0].value)})`
                : ''}
            </Text>
            {report?.pending ? (
              <Text size="xs" weight="semibold" style={{ color: colors.warning[300], marginTop: 4 }}>
                {report.pending} laporan menunggu persetujuan
              </Text>
            ) : null}
          </HeroCard>

          {isKepalaToko ? (
            <View style={[styles.card, styles.row]}>
              <View style={styles.flex}>
                <Text weight="semibold" size="sm">
                  Perlu persetujuan Kepala Toko
                </Text>
                <Text size="xs" color="muted">
                  {requireApproval
                    ? 'Laporan staf menunggu disetujui sebelum stok dikurangi'
                    : 'Stok langsung dikurangi saat staf mencatat'}
                </Text>
              </View>
              <Switch value={requireApproval} onValueChange={toggleApproval} />
            </View>
          ) : null}

          {can('inventory.bad_stock') ? (
            <Button leftIcon={<PlusIcon size={16} color={colors.white} />} onPress={() => navigation.navigate('BadStockForm')}>
              Catat Bad Stock
            </Button>
          ) : null}

          <View style={{ marginHorizontal: -16 }}>
            <FilterChips<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'ALL', label: 'Semua', count: items.length },
                { value: 'PENDING', label: 'Menunggu', count: countOf('PENDING') },
                { value: 'QUARANTINED', label: 'Dipisahkan', count: countOf('QUARANTINED') },
                { value: 'RETURNED', label: 'Diretur', count: countOf('RETURNED') },
                { value: 'DISPOSED', label: 'Dimusnahkan', count: countOf('DISPOSED') },
                { value: 'CANCELLED', label: 'Dibatalkan', count: countOf('CANCELLED') },
              ]}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        loading ? null : (
          <EmptyState
            icon={AlertTriangleIcon}
            title="Tidak ada bad stock"
            description="Barang rusak, kedaluwarsa, atau hilang yang dicatat akan tampil di sini."
          />
        )
      }
      renderItem={({ item }) => {
        const status = BS_STATUS[item.status];
        const emoji = REASONS.find((r) => r.value === item.reason)?.emoji ?? '📦';
        return (
          <Pressable onPress={() => openActions(item)} style={[styles.card, { gap: 8 }]}>
            <View style={styles.row}>
              <View
                style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warning[50] }}
              >
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text size="lg">{emoji}</Text>
                )}
              </View>
              <View style={styles.flex}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text size="xs" color="secondary" numberOfLines={1}>
                  {qty(item.quantity)} {item.unitName} · {reasonLabel(item.reason)}
                  {item.costValue !== null ? ` · ${rupiah(item.costValue)}` : ''}
                </Text>
              </View>
              <Badge variant={status.tone}>{status.label}</Badge>
            </View>
            {item.notes ? (
              <Text size="xs" color="muted" numberOfLines={2}>
                “{item.notes}”
              </Text>
            ) : null}
            <Text size="xs" color="muted">
              Dicatat {item.reportedBy ?? '-'} · {dateTime(item.createdAt)}
              {item.supplierName ? ` · ke ${item.supplierName}` : ''}
            </Text>
          </Pressable>
        );
      }}
    />
    <Modal isOpen={!!returnTarget} onClose={() => setReturnTarget(null)}>
      {returnTarget ? (
        <ReturnForm
          item={returnTarget}
          onDone={() => {
            setReturnTarget(null);
            load();
          }}
          onCancel={() => setReturnTarget(null)}
        />
      ) : null}
    </Modal>
    </>
  );
}

/** Retur bad stock: pilih supplier tujuan (tercatat di laporan) + catatan opsional. */
function ReturnForm({ item, onDone, onCancel }: { item: BadStockItem; onDone: () => void; onCancel: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    suppliersApi
      .fetchSuppliers()
      .then((list) => setSuppliers(list.filter((s) => s.active)))
      .catch(() => setSuppliers([]));
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      await inventoryApi.actOnBadStock(item.id, 'return', { supplierId: supplierId ?? undefined, note: note.trim() || undefined });
      onDone();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Retur tidak bisa dicatat.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text weight="bold" size="lg">
        Retur ke Supplier
      </Text>
      <Text size="sm" color="secondary" style={local.hint}>
        {qty(item.quantity)} {item.unitName} {item.productName} · {reasonLabel(item.reason)}
      </Text>
      <Text size="xs" weight="semibold" color="muted" style={local.label}>
        DIRETUR KE
      </Text>
      <ScrollView style={local.list} keyboardShouldPersistTaps="handled">
        {suppliers === null ? (
          <Text size="sm" color="muted">
            Memuat supplier...
          </Text>
        ) : suppliers.length === 0 ? (
          <Text size="sm" color="muted">
            Belum ada supplier aktif. Retur tetap bisa dicatat tanpa supplier.
          </Text>
        ) : (
          suppliers.map((s) => {
            const active = s.id === supplierId;
            return (
              <Pressable key={s.id} onPress={() => setSupplierId(active ? null : s.id)} style={[local.option, active && local.optionActive]}>
                <View style={[local.optionIcon, active && local.optionIconActive]}>
                  <TruckIcon size={16} color={active ? colors.white : colors.teal[700]} />
                </View>
                <View style={local.optionBody}>
                  <Text weight="semibold" numberOfLines={1}>
                    {s.supplierName}
                  </Text>
                  <Text size="xs" color="muted" numberOfLines={1}>
                    {[s.supplierCode, s.contactPerson, s.phone].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {active ? <CheckIcon size={16} color={colors.primary[600]} /> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Catatan (opsional), mis. no. surat jalan retur"
        placeholderTextColor={colors.gray[400]}
        maxLength={500}
        style={local.note}
      />
      <View style={local.actions}>
        <Button variant="ghost" onPress={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button onPress={submit} loading={saving}>
          {supplierId ? 'Catat Retur' : 'Catat Tanpa Supplier'}
        </Button>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  hint: { marginTop: 4 },
  label: { letterSpacing: 0.8, marginTop: spacing.base, marginBottom: spacing.sm },
  list: { maxHeight: 280 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal[50],
  },
  optionIconActive: { backgroundColor: colors.primary[600] },
  optionBody: { flex: 1, gap: 1 },
  note: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text.primary,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
});
