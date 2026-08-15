import { useEffect } from 'react';
import { ActivityIndicator, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearReceipt, fetchReceipt } from '@/store/slices/ordersSlice';
import type { RootStackParamList } from '@/navigation/types';
import { formatReceiptText } from '@/utils/receiptText';
import { colors, spacing } from '@/theme';
import { Button } from '@/components/ui/forms';
import { Card, AppBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

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

  const onShare = async () => {
    if (!receipt) return;
    try {
      await Share.share({ message: receiptText });
    } catch {
      // User batal share atau share sheet gagal dibuka — tidak perlu ditampilkan sebagai error.
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
        <>
          <ScrollView contentContainerStyle={styles.body}>
            <Card>
              <Text style={styles.receiptText}>{receiptText}</Text>
            </Card>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              variant="outline"
              style={styles.action}
              onPress={() => navigation.navigate('Main', { screen: 'POS' })}
            >
              Selesai
            </Button>
            <Button style={styles.action} onPress={onShare}>
              Bagikan
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { marginTop: spacing.sm },
  body: { padding: spacing.base },
  receiptText: { fontFamily: MONOSPACE_FONT, fontSize: 12, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: { flex: 1 },
});
