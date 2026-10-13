import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as inventoryApi from '@/api/inventoryApi';
import { apiErrorMessage } from '@/api/errors';
import { useAppSelector } from '@/store/hooks';
import { usePermissions } from '@/hooks/usePermissions';
import { useMenuAccess } from '@/navigation/menuCatalog';
import type { RootStackParamList } from '@/navigation/types';
import type { BadStockItem, BadStockReport, BadStockStatus } from '@/types/models';
import { colors } from '@/theme';
import { Button, Pressable, Switch } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { AlertTriangleIcon, PlusIcon } from '@/components/icons/LineIcons';

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
        buttons.push({ text: 'Sudah diretur ke supplier', onPress: () => act(item, 'return') });
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
  );
}
