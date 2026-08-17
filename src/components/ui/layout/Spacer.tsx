import { View } from 'react-native';
import type { ViewProps } from 'react-native';

// Pengisi fleksibel — taruh di antara dua elemen dalam HStack/VStack buat
// mendorong keduanya ke ujung berlawanan (mis. label di kiri, aksi di kanan)
// tanpa perlu `justifyContent: 'space-between'` di parent.
export function Spacer({ style, ...rest }: ViewProps) {
  return <View style={[{ flex: 1 }, style]} {...rest} />;
}
