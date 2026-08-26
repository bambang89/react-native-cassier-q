import { Fragment, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearReceipt, fetchReceipt } from '@/store/slices/ordersSlice';
import type { RootStackParamList } from '@/navigation/types';
import { buildReceiptRows, formatReceiptText } from '@/utils/receiptText';
import { getPrinter, getPrinterConfig, saveReceiptText } from '@/services/printing';
import { colors, spacing } from '@/theme';
import { Button } from '@/components/ui/forms';
import { Card, AppBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { FolderIcon, PrintIcon } from '@/components/icons/LineIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'Receipt'>;

const MONOSPACE_FONT = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

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

  const receiptText = receipt ? formatReceiptText(receipt) : '';
  const receiptRows = receipt ? buildReceiptRows(receipt) : [];

  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);

  const onShare = async () => {
    if (!receipt) return;
    try {
      await Share.share({ message: receiptText });
    } catch {
      // User batal share atau share sheet gagal dibuka — tidak perlu ditampilkan sebagai error.
    }
  };

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
        <Fragment>
          <ScrollView contentContainerStyle={styles.body}>
            <Card style={styles.receiptCard}>
              {receiptRows.map((row, index) => {
                switch (row.kind) {
                  case 'center':
                    return (
                      <Text key={index} style={[styles.receiptLine, styles.receiptCenterLine]}>
                        {row.text}
                      </Text>
                    );
                  case 'line':
                  case 'divider':
                    return (
                      <Text key={index} style={styles.receiptLine}>
                        {row.text}
                      </Text>
                    );
                  case 'pair':
                    return (
                      <View key={index} style={styles.receiptRow}>
                        <Text style={styles.receiptLine}>{row.label}</Text>
                        <Text style={styles.receiptLine}>{row.value}</Text>
                      </View>
                    );
                }
              })}
            </Card>
          </ScrollView>

          <View style={styles.actions}>
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
        </Fragment>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { marginTop: spacing.sm },
  body: { padding: spacing.base, alignItems: 'center' },
  receiptCard: { alignSelf: 'center', maxWidth: 370 },
  receiptLine: { fontFamily: MONOSPACE_FONT, fontSize: 12, lineHeight: 18 },
  receiptCenterLine: { textAlign: 'center' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 370,
    gap: spacing.sm,
    padding: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
