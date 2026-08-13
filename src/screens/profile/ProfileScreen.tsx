import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Akun</Text>
      <Text style={styles.name}>{user?.name ?? '-'}</Text>
      <Text style={styles.email}>{user?.email ?? '-'}</Text>

      <Pressable style={styles.button} onPress={() => dispatch(logout())}>
        <Text style={styles.buttonText}>Keluar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  name: { fontSize: 18, fontWeight: '600' },
  email: { color: '#999', marginBottom: 32 },
  button: { backgroundColor: '#dc2626', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
