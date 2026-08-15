import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createCategory, deleteCategory, fetchCategories } from '@/store/slices/categoriesSlice';
import type { RootStackParamList } from '@/navigation/types';
import type { Category } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { Divider } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { AppBar, Card } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

export default function CategoriesScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.categories);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const onDelete = async (category: Category) => {
    try {
      await dispatch(deleteCategory(category.id)).unwrap();
      setDeleteTarget(null);
    } catch {
      Alert.alert('Gagal', 'Kategori tidak bisa dihapus (mungkin masih dipakai produk).');
      setDeleteTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Kategori"
        onBack={navigation.goBack}
        rightElement={
          <Button size="sm" onPress={() => setFormOpen(true)}>
            + Baru
          </Button>
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => dispatch(fetchCategories())}
        refreshing={status === 'loading'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <Divider spacingY="xs" />}
        renderItem={({ item }) => (
          <Card shadow="none" style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text weight="semibold">{item.categoryName}</Text>
                <Text size="xs" color="secondary">
                  {item.categoryCode}
                  {item.parentCategoryName ? ` · sub dari ${item.parentCategoryName}` : ''}
                </Text>
              </View>
              <Button variant="ghost" size="sm" onPress={() => setDeleteTarget(item)}>
                Hapus
              </Button>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Text color="muted" align="center" style={styles.empty}>
            {status === 'loading' ? 'Memuat kategori...' : 'Belum ada kategori'}
          </Text>
        }
      />

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)}>
        <NewCategoryForm onDone={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
      </Modal>

      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus kategori?"
        description={`"${deleteTarget?.categoryName}" akan dihapus.`}
        confirmText="Hapus"
        isDanger
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
      />
    </View>
  );
}

function NewCategoryForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await dispatch(createCategory({ categoryCode, categoryName })).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Kategori tidak bisa dibuat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Kategori Baru
      </Text>
      <FormControl label="Kode kategori" isRequired>
        <Input value={categoryCode} onChangeText={setCategoryCode} placeholder="mis. MKN" autoCapitalize="characters" />
      </FormControl>
      <FormControl label="Nama kategori" isRequired>
        <Input value={categoryName} onChangeText={setCategoryName} placeholder="mis. Makanan" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button
          onPress={onSubmit}
          loading={submitting}
          disabled={!categoryCode || !categoryName}
          style={styles.modalAction}
        >
          Simpan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.base },
  card: { paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1 },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
