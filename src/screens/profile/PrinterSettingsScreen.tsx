import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { IBLEPrinter } from 'react-native-earl-thermal-printer';

import {
  clearPrinterConfig,
  connectBluetoothPrinter,
  getPaperWidth,
  getPrinterConfig,
  PAPER_CHARS,
  savePaperWidth,
  savePrinterConfig,
  scanBluetoothPrinters,
} from '@/services/printing';
import type { PaperWidth, PrinterType, StoredPrinterConfig } from '@/services/printing';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';
import { Button, Pressable } from '@/components/ui/forms';
import { AppBar, Card, EmptyState } from '@/components/ui/recipes';
import { BluetoothIcon, CheckIcon, PrintIcon, TrashIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';
import { PaperWidthPicker } from '@/components/printing';

type Props = NativeStackScreenProps<RootStackParamList, 'PrinterSettings'>;

type PairablePrinterType = Exclude<PrinterType, 'SYSTEM'>;

const PRINTER_TYPE_OPTIONS: {
  value: PairablePrinterType;
  label: string;
  description: string;
  enabled: boolean;
}[] = [
  { value: 'THERMAL', label: 'Thermal', description: 'Printer struk kasir umum, tanpa tinta', enabled: true },
  { value: 'DOT_MATRIX', label: 'Dot Matrix / Impact', description: 'Pita tinta, cocok untuk nota rangkap', enabled: true },
  { value: 'LABEL', label: 'Label (ZPL/TSPL)', description: 'Cetak label & barcode produk', enabled: false },
];

/** Printer settings: paper width, printer type, and pairing a Bluetooth printer. */
export default function PrinterSettingsScreen({ navigation }: Props) {
  const [selectedType, setSelectedType] = useState<PairablePrinterType>('THERMAL');
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<IBLEPrinter[]>([]);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);
  const [config, setConfig] = useState<StoredPrinterConfig | null>(null);
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(58);

  useFocusEffect(
    useCallback(() => {
      getPrinterConfig().then(setConfig);
      getPaperWidth().then(setPaperWidth);
    }, []),
  );

  /** Updates and persists the receipt paper width (58mm / 80mm). */
  const onChangePaperWidth = (width: PaperWidth) => {
    setPaperWidth(width);
    savePaperWidth(width);
  };

  /** Lists Bluetooth printers already paired with this device. */
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

  /** Connects to the chosen printer and saves it as the default printer. */
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

  /** Asks for confirmation, then removes the saved printer. */
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

  const typeLabel = (type: PrinterType) =>
    type === 'THERMAL' ? 'Thermal' : type === 'DOT_MATRIX' ? 'Dot Matrix' : type;

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
              <Card padding="none" style={styles.statusCard}>
                <View style={styles.statusBody}>
                  <View style={styles.statusIconWrap}>
                    <PrintIcon size={24} color={colors.primary[600]} />
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text size="xs" weight="semibold" color="success">
                        Printer aktif
                      </Text>
                    </View>
                    <Text size="lg" weight="semibold" numberOfLines={1}>
                      {config.deviceName}
                    </Text>
                    <Text size="xs" color="muted" numberOfLines={1}>
                      {typeLabel(config.type)} · {config.deviceAddress}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusFooter}>
                  <Text size="xs" color="secondary">
                    Kertas {paperWidth}mm · {PAPER_CHARS[paperWidth]} karakter/baris
                  </Text>
                  <Pressable onPress={onForget} accessibilityLabel="Lupakan printer" style={styles.forgetButton}>
                    <TrashIcon size={14} color={colors.error[600]} />
                    <Text size="xs" weight="semibold" color="error">
                      Lupakan
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ) : (
              <View style={styles.emptyStatus}>
                <View style={styles.emptyIconWrap}>
                  <PrintIcon size={22} color={colors.gray[500]} />
                </View>
                <View style={styles.flex}>
                  <Text weight="semibold">Belum ada printer</Text>
                  <Text size="xs" color="secondary" style={styles.emptyHint}>
                    Nyalakan printer &amp; pairing lewat pengaturan Bluetooth perangkat, lalu cari di bawah.
                  </Text>
                </View>
              </View>
            )}

            <Text size="xs" weight="semibold" color="muted" style={styles.sectionLabel}>
              PENGATURAN CETAK
            </Text>
            <Card style={styles.settingsCard}>
              <Text size="sm" weight="semibold" style={styles.fieldLabel}>
                Ukuran kertas
              </Text>
              <PaperWidthPicker value={paperWidth} onChange={onChangePaperWidth} showChars />

              <View style={styles.divider} />

              <Text size="sm" weight="semibold" style={styles.fieldLabel}>
                Jenis printer
              </Text>
              <View accessibilityRole="radiogroup" style={styles.typeList}>
                {PRINTER_TYPE_OPTIONS.map((option) => {
                  const active = selectedType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      disabled={!option.enabled}
                      onPress={() => setSelectedType(option.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active, disabled: !option.enabled }}
                      style={[
                        styles.typeOption,
                        active && styles.typeOptionActive,
                        !option.enabled && styles.typeOptionDisabled,
                      ]}
                    >
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active ? <CheckIcon size={12} strokeWidth={2.6} color={colors.white} /> : null}
                      </View>
                      <View style={styles.flex}>
                        <Text size="sm" weight="semibold" color={active ? 'link' : 'primary'}>
                          {option.label}
                        </Text>
                        <Text size="xs" color="muted">
                          {option.description}
                        </Text>
                      </View>
                      {!option.enabled ? (
                        <View style={styles.soonBadge}>
                          <Text size="xs" weight="semibold" color="muted">
                            Segera
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <View style={styles.devicesHeader}>
              <Text size="xs" weight="semibold" color="muted">
                PERANGKAT BLUETOOTH{devices.length > 0 ? ` · ${devices.length}` : ''}
              </Text>
            </View>
            <Button
              onPress={onScan}
              loading={scanning}
              variant={devices.length > 0 ? 'outline' : 'solid'}
              leftIcon={
                <BluetoothIcon size={18} color={devices.length > 0 ? colors.primary[600] : colors.white} />
              }
              style={styles.scanButton}
            >
              {devices.length > 0 ? 'Pindai Ulang' : 'Cari Printer Bluetooth'}
            </Button>
          </View>
        }
        renderItem={({ item, index }) => {
          const isSaved = config?.deviceAddress === item.inner_mac_address;
          const isConnecting = connectingAddress === item.inner_mac_address;
          return (
            <Pressable
              onPress={() => onConnect(item)}
              disabled={connectingAddress !== null}
              accessibilityLabel={`Sambungkan ${item.device_name || 'perangkat'}`}
              style={[
                styles.deviceRow,
                index === 0 && styles.deviceRowFirst,
                index === devices.length - 1 && styles.deviceRowLast,
              ]}
            >
              <View style={[styles.deviceIconWrap, isSaved && styles.deviceIconWrapSaved]}>
                <BluetoothIcon size={18} color={isSaved ? colors.success[600] : colors.primary[600]} />
              </View>
              <View style={styles.flex}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.device_name || 'Perangkat tanpa nama'}
                </Text>
                <Text size="xs" color="muted">
                  {item.inner_mac_address}
                </Text>
              </View>
              {isConnecting ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : isSaved ? (
                <View style={styles.savedBadge}>
                  <CheckIcon size={12} strokeWidth={2.4} color={colors.success[700]} />
                  <Text size="xs" weight="semibold" color="success">
                    Terpasang
                  </Text>
                </View>
              ) : (
                <View style={styles.connectPill}>
                  <Text size="xs" weight="semibold" color="link">
                    Sambungkan
                  </Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !scanning ? (
            <EmptyState
              icon={BluetoothIcon}
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
  container: { flex: 1, backgroundColor: colors.canvas },
  list: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  flex: { flex: 1 },

  statusCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  statusBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base },
  statusIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  statusDot: { width: 7, height: 7, borderRadius: radii.full, backgroundColor: colors.success[500] },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  forgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.error[50],
  },

  emptyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: { marginTop: 2 },

  sectionLabel: { marginBottom: spacing.sm, marginLeft: spacing.xs, letterSpacing: 0.6 },
  settingsCard: { marginBottom: spacing.lg },
  fieldLabel: { marginBottom: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.base },

  typeList: { gap: spacing.sm },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeOptionActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  typeOptionDisabled: { opacity: 0.55 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  soonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.gray[100],
  },

  devicesHeader: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  scanButton: { marginBottom: spacing.md },

  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  deviceRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  deviceRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  deviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconWrapSaved: { backgroundColor: colors.success[50] },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.success[50],
  },
  connectPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
});
