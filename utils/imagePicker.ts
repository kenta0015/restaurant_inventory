// utils/imagePicker.ts
import * as ImagePicker from 'expo-image-picker';

export async function pickInvoiceImage(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    base64: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.[0].base64) {
    return result.assets[0].base64;
  }

  return null;
}
