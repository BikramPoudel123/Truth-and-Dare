import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export interface SelectedMedia {
  type: "photo" | "video";
  base64: string;
  uri: string;
}

interface MediaPickerProps {
  selected: SelectedMedia[];
  onChange: (media: SelectedMedia[]) => void;
}

const MAX_ATTACHMENTS_PER_BATCH = 3;
const MAX_IMAGE_BASE64_CHARS = 2_000_000;
const MAX_VIDEO_BASE64_CHARS = 4_000_000;

async function convertToBase64(uri: string): Promise<string> {
  try {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return "";
  }
}

async function processAssets(
  assets: ImagePicker.ImagePickerAsset[],
  type: "photo" | "video",
): Promise<SelectedMedia[]> {
  const processed = await Promise.all(
    assets.map(async (asset) => {
      const raw =
        type === "photo"
          ? (asset.base64 ?? (await convertToBase64(asset.uri)))
          : await convertToBase64(asset.uri);

      const maxChars =
        type === "video" ? MAX_VIDEO_BASE64_CHARS : MAX_IMAGE_BASE64_CHARS;
      if (!raw || raw.length > maxChars) {
        return null;
      }

      const mime = type === "photo" ? "image/jpeg" : "video/mp4";
      return { type, base64: `data:${mime};base64,${raw}`, uri: asset.uri };
    }),
  );

  return processed.filter((item): item is SelectedMedia => Boolean(item));
}

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission needed",
      "Camera permission is required to take photos/videos.",
    );
    return false;
  }
  return true;
}

async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission needed",
      "Media library permission is required to pick photos/videos.",
    );
    return false;
  }
  return true;
}

export function MediaPicker({ selected, onChange }: MediaPickerProps) {
  const add = (items: SelectedMedia[]) => {
    const next = [...selected, ...items];
    if (next.length > MAX_ATTACHMENTS_PER_BATCH) {
      Alert.alert(
        "Too many files",
        `Please attach up to ${MAX_ATTACHMENTS_PER_BATCH} files at a time.`,
      );
      return;
    }
    onChange(next);
  };
  const remove = (idx: number) =>
    onChange(selected.filter((_, i) => i !== idx));

  const pickImages = async () => {
    if (!(await requestMediaPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const processed = await processAssets(result.assets, "photo");
      if (processed.length === 0 && result.assets.length > 0) {
        Alert.alert(
          "Large file",
          "Please choose a smaller image to keep the chat stable.",
        );
      }
      add(processed);
    }
  };

  const pickVideos = async () => {
    if (!(await requestMediaPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const processed = await processAssets(result.assets, "video");
      if (processed.length === 0 && result.assets.length > 0) {
        Alert.alert(
          "Large file",
          "Please choose a smaller video to keep the chat stable.",
        );
      }
      add(processed);
    }
  };

  const takePhoto = async () => {
    if (!(await requestCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const processed = await processAssets(result.assets, "photo");
      if (processed.length === 0 && result.assets.length > 0) {
        Alert.alert(
          "Large file",
          "Please choose a smaller image to keep the chat stable.",
        );
      }
      add(processed);
    }
  };

  const takeVideo = async () => {
    if (!(await requestCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos",
    });
    if (!result.canceled) {
      const processed = await processAssets(result.assets, "video");
      if (processed.length === 0 && result.assets.length > 0) {
        Alert.alert(
          "Large file",
          "This video is too large to send safely. Please choose a smaller video or send fewer files.",
        );
      }
      add(processed);
    }
  };

  return (
    <View>
      {selected.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
        >
          {selected.map((m, idx) => (
            <View key={idx} style={styles.thumb}>
              {m.type === "photo" ? (
                <Image source={{ uri: m.uri }} style={styles.thumbImg} />
              ) : (
                <View style={styles.thumbVideo}>
                  <Text style={styles.thumbVideoIcon}>🎬</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => remove(idx)}
              >
                <Text style={styles.removeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.blue]}
          onPress={takePhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.btnEmoji}>📸</Text>
          <Text style={styles.btnTxt}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.cyan]}
          onPress={pickImages}
          activeOpacity={0.8}
        >
          <Text style={styles.btnEmoji}>🖼️</Text>
          <Text style={styles.btnTxt}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.red]}
          onPress={takeVideo}
          activeOpacity={0.8}
        >
          <Text style={styles.btnEmoji}>🎥</Text>
          <Text style={styles.btnTxt}>Record</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.purple]}
          onPress={pickVideos}
          activeOpacity={0.8}
        >
          <Text style={styles.btnEmoji}>📹</Text>
          <Text style={styles.btnTxt}>Videos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { marginBottom: 10 },
  thumb: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#6b21a8",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbVideoIcon: { fontSize: 28 },
  removeBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  removeTxt: { color: "white", fontSize: 10, fontWeight: "bold" },
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  blue: { backgroundColor: "#2563eb" },
  cyan: { backgroundColor: "#0891b2" },
  red: { backgroundColor: "#dc2626" },
  purple: { backgroundColor: "#9333ea" },
  btnEmoji: { fontSize: 20, marginBottom: 4 },
  btnTxt: { color: "white", fontSize: 12, fontWeight: "700" },
});
