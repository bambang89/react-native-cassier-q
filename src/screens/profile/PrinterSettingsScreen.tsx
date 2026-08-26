import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { IBLEPrinter } from 'react-native-earl-thermal-printer';

import {
  clearPrinterConfig,
  connectBluetoothPrinter,
  getPrinterConfig,
  savePrinterConfig,
  scanBluetoothPrinters,
} from '@/services/printing';
import type { PrinterType, StoredPrinterConfig } from '@/services/printing';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';
import { Button, Pressable } from '@/components/ui/forms';
import { AppBar, Card, EmptyState } from '@/components/ui/recipes';
import { PrintIcon, TrashIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'PrinterSettings'>;

type PairablePrinterType = Exclude<PrinterType, 'SYSTEM'>;

const PRINTER_TYPE_OPTIONS: { value: PairablePrinterType; label: string; enabled: boolean }[] = [
  { value: 'THERMAL', label: 'Thermal', enabled: true },
  { value: 'DOT_MATRIX', label: 'Dot Matrix / Impact', enabled: true },
  { value: 'LABEL', label: 'Label (ZPL/TSPL)', enabled: false },
];

export default function PrinterSettingsScreen({ navigation }: Props) {
  const [selectedType, setSelectedType] = useState<PairablePrinterType>('THERMAL');
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<IBLEPrinter[]>([]);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);
  const [config, setConfig] = useState<StoredPrinterConfig | null>(null);

  useFocusEffect(
    useCallback(() => {
      getPrinterConfig().then(setConfig);
    }, []),
  );

  const onScan = async () => {
    setScanning(true);
    setDevices([]);
    try {
      const found = await scanBluetoothPrinters();
      setDevices(found);
    } catch (error) {
      Alert.alert(
        'Gagal memindai',
        error instanceof Error ? error.message : 'Tidak bisa memindai printer Bluetooth.',
      );
    } finally {
      setScanning(false);
    }
  };

  const onConnect = async (device: IBLEPrinter) => {
    setConnectingAddress(device.inner_mac_address);
    try {
      await connectBluetoothPrinter(device.inner_mac_address);
      const nextConfig: StoredPrinterConfig = {
        type: selectedType === 'LABEL' ? 'THERMAL' : selectedType,
        deviceName: device.device_name,
        deviceAddress: device.inner_mac_address,
      };
      await savePrinterConfig(nextConfig);
      setConfig(nextConfig);
      Alert.alert('Terhubung', `${device.device_name} berhasil dipasangkan sebagai printer.`);
    } catch (error) {
      Alert.alert(
        'Gagal menghubungkan',
        error instanceof Error ? error.message : 'Tidak bisa menghubungkan ke printer ini.',
      );
    } finally {
      setConnectingAddress(null);
    }
  };

  const onForget = () => {
    Alert.alert('Lupakan printer?', 'Printer yang tersimpan akan dilepas dari aplikasi ini.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Lupakan',
        style: 'destructive',
        onPress: async () => {
          await clearPrinterConfig();
          setConfig(null);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppBar title="Pilih Printer" onBack={navigation.goBack} />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.inner_mac_address}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {config ? (
              <Card style={styles.currentCard}>
                <View style={styles.currentRow}>
                  <View style={styles.currentIconWrap}>
                    <PrintIcon size={18} color={colors.primary[600]} />
                  </View>
                  <View style={styles.currentInfo}>
                    <Text weight="semibold">{config.deviceName}</Text>
                    <Text size="xs" color="secondary">
                      {config.type === 'THERMAL' ? 'Thermal Printer' : 'Dot Matrix / Impact Printer'} ·{' '}
                      {config.deviceAddress}
                    </Text>
                  </View>
                  <Pressable onPress={onForget} accessibilityLabel="Lupakan printer" style={styles.forgetButton}>
                    <TrashIcon size={16} color={colors.error[600]} />
                  </Pressable>
                </View>
              </Card>
            ) : (
              <Text color="secondary" size="sm" style={styles.hint}>
                Belum ada printer yang dipasangkan. Nyalakan &amp; pairing dulu printer Bluetooth Anda lewat
                pengaturan Bluetooth perangkat, lalu pindai di bawah.
              </Text>
            )}

            <Text weight="semibold" size="sm" style={styles.sectionLabel}>
              Jenis printer
            </Text>
            <View style={styles.typeRow}>
              {PRINTER_TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  disabled={!option.enabled}
                  onPress={() => setSelectedType(option.value)}
                  style={[
                    styles.typeChip,
                    selectedType === option.value && styles.typeChipActive,
                    !option.enabled && styles.typeChipDisabled,
                  ]}
                >
                  <Text
                    size="sm"
                    weight="semibold"
                    color={selectedType === option.value ? 'inverse' : 'secondary'}
                  >
                    {option.label}
                    {!option.enabled ? ' (segera hadir)' : ''}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button onPress={onScan} loading={scanning} style={styles.scanButton}>
              Cari Printer Bluetooth
            </Button>

            {devices.length > 0 ? (
              <Text weight="semibold" size="sm" style={styles.sectionLabel}>
                Perangkat ditemukan
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.deviceCard} onPress={() => onConnect(item)}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceInfo}>
                <Text weight="semibold">{item.device_name || 'Perangkat tanpa nama'}</Text>
                <Text size="xs" color="secondary">
                  {item.inner_mac_address}
                </Text>
              </View>
              <Button
                size="sm"
                variant="outline"
                loading={connectingAddress === item.inner_mac_address}
                onPress={() => onConnect(item)}
              >
                Sambungkan
              </Button>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !scanning ? (
            <EmptyState
              icon={PrintIcon}
              title="Belum Ada Perangkat"
              description="Ketuk 'Cari Printer Bluetooth' untuk memindai printer yang sudah di-pairing di pengaturan Bluetooth perangkat ini."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  hint: { marginBottom: spacing.base },
  currentCard: { marginBottom: spacing.base },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentInfo: { flex: 1 },
  forgetButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
  },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  typeChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  typeChipDisabled: { opacity: 0.5 },
  scanButton: { marginBottom: spacing.base },
  deviceCard: { marginBottom: spacing.sm },
  deviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  deviceInfo: { flex: 1 },
});
