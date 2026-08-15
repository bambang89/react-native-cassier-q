import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import * as authApi from '../../api/authApi';
import { getActiveApiEnv, setActiveApiEnv } from '../../api/client';
import { API_ENVIRONMENTS, API_ENV_NAMES } from '../../config/apiEnvironments';
import type { ApiEnvName } from '../../config/apiEnvironments';
import { env } from '../../config/env';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { closeSession, fetchCurrentSession } from '../../store/slices/cashierSessionSlice';
import { colors, spacing } from '../../theme';
import { Button, FormControl, Input, Select } from '../../components/ui/forms';
import { Badge, Divider } from '../../components/ui/dataDisplay';
import { AlertDialog, Modal } from '../../components/ui/overlay';
import { Card, Header } from '../../components/ui/recipes';
import { Text } from '../../components/ui/typography';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const session = useAppSelector((state) => state.cashierSession.current);
  const [closeSessionVisible, setCloseSessionVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentSession());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Header title="Akun" />
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <Text weight="semibold" size="lg">
            {user?.name ?? '-'}
          </Text>
          <Text color="secondary" size="sm">
            {user?.email ?? '-'} · @{user?.username ?? '-'}
          </Text>
          <View style={styles.roles}>
            {user?.roles.map((role) => (
              <Badge key={`${role.roleCode}-${role.storeId ?? 'global'}`} variant="primary">
                {role.roleName}
              </Badge>
            ))}
          </View>
        </Card>

        <Text weight="semibold" style={styles.sectionTitle}>
          Sesi Kasir
        </Text>
        <Card>
          {session ? (
            <>
              <Text size="sm">
                Dibuka {new Date(session.openedAt).toLocaleString('id-ID')}
              </Text>
              <Text size="sm" color="secondary" style={styles.sessionCash}>
                Modal awal: Rp {session.openingCash.toLocaleString('id-ID')}
              </Text>
              <Button variant="outline" size="sm" style={styles.closeSessionButton} onPress={() => setCloseSessionVisible(true)}>
                Tutup Sesi
              </Button>
            </>
          ) : (
            <Text color="muted" size="sm">
              Tidak ada sesi kasir yang sedang terbuka.
            </Text>
          )}
        </Card>

        <Text weight="semibold" style={styles.sectionTitle}>
          Keamanan
        </Text>
        <Card padding="none">
          <Button variant="ghost" style={styles.rowButton} onPress={() => setChangePasswordVisible(true)}>
            Ganti Kata Sandi
          </Button>
        </Card>

        {env.appVariant !== 'production' ? (
          <>
            <Text weight="semibold" style={styles.sectionTitle}>
              Environment API (dev only)
            </Text>
            <Card>
              <EnvSwitcher />
            </Card>
          </>
        ) : null}

        <Button variant="danger" style={styles.logoutButton} onPress={() => setLogoutConfirmVisible(true)}>
          Keluar
        </Button>
      </ScrollView>

      <Modal isOpen={closeSessionVisible} onClose={() => setCloseSessionVisible(false)}>
        {session ? (
          <CloseSessionForm
            sessionId={session.id}
            onDone={() => setCloseSessionVisible(false)}
            onCancel={() => setCloseSessionVisible(false)}
          />
        ) : null}
      </Modal>

      <Modal isOpen={changePasswordVisible} onClose={() => setChangePasswordVisible(false)}>
        <ChangePasswordForm onDone={() => setChangePasswordVisible(false)} onCancel={() => setChangePasswordVisible(false)} />
      </Modal>

      <AlertDialog
        isOpen={logoutConfirmVisible}
        onClose={() => setLogoutConfirmVisible(false)}
        title="Keluar dari akun?"
        confirmText="Keluar"
        isDanger
        onConfirm={() => {
          setLogoutConfirmVisible(false);
          dispatch(logout());
        }}
      />
    </View>
  );
}

function CloseSessionForm({
  sessionId,
  onDone,
  onCancel,
}: {
  sessionId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const parsed = Number(actualCash);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setSubmitting(true);
    try {
      await dispatch(closeSession({ id: sessionId, actualCash: parsed, notes: notes || undefined })).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Sesi kasir tidak bisa ditutup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Tutup Sesi Kasir
      </Text>
      <FormControl label="Kas fisik yang dihitung" isRequired>
        <Input keyboardType="numeric" value={actualCash} onChangeText={setActualCash} placeholder="0" />
      </FormControl>
      <FormControl label="Catatan (opsional)">
        <Input value={notes} onChangeText={setNotes} placeholder="mis. selisih karena kembalian" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!actualCash} style={styles.modalAction}>
          Tutup
        </Button>
      </View>
    </View>
  );
}

function ChangePasswordForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Alert.alert('Berhasil', 'Kata sandi sudah diganti.');
      onDone();
    } catch {
      Alert.alert('Gagal', 'Kata sandi saat ini salah, atau kata sandi baru tidak memenuhi syarat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Ganti Kata Sandi
      </Text>
      <FormControl label="Kata sandi saat ini" isRequired>
        <Input secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
      </FormControl>
      <FormControl label="Kata sandi baru" isRequired helperText="Minimal 8 karakter">
        <Input secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button
          onPress={onSubmit}
          loading={submitting}
          disabled={!currentPassword || newPassword.length < 8}
          style={styles.modalAction}
        >
          Simpan
        </Button>
      </View>
    </View>
  );
}

function EnvSwitcher() {
  const [current, setCurrent] = useState<ApiEnvName>(getActiveApiEnv());
  const [switching, setSwitching] = useState(false);

  const onChange = async (next: ApiEnvName) => {
    setSwitching(true);
    try {
      await setActiveApiEnv(next);
      setCurrent(next);
      Alert.alert('Environment diganti', `Sekarang memakai ${API_ENVIRONMENTS[next].label}. Silakan masuk lagi.`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View>
      <Text size="xs" color="muted" style={styles.envHint}>
        Ganti backend yang dipakai app tanpa build ulang. Sesi login akan direset.
      </Text>
      <Select
        value={current}
        onChange={onChange}
        isDisabled={switching}
        options={API_ENV_NAMES.map((name) => ({ label: API_ENVIRONMENTS[name].label, value: name }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  sessionCash: { marginTop: spacing.xs },
  closeSessionButton: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  rowButton: { alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  logoutButton: { marginTop: spacing['2xl'] },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
  envHint: { marginBottom: spacing.sm },
});
