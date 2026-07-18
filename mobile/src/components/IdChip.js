import { useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Coaches need something concrete to reference ("assignment #4f2a1c") when they talk to an
// athlete or look something up later. Mongo's full _id is too long to read at a glance, so we
// show the last 6 characters as a short code and copy the *full* id to the clipboard on tap,
// so it can be pasted anywhere (support message, search box, etc.) without retyping it.
export default function IdChip({ id, label = 'ID' }) {
  const [copied, setCopied] = useState(false);
  if (!id) return null;

  const shortId = id.slice(-6).toUpperCase();

  const handlePress = async () => {
    await Clipboard.setStringAsync(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Pressable onPress={handlePress} style={styles.chip}>
      <Text style={styles.text}>
        {label} {shortId}
      </Text>
      {copied && <Text style={styles.copied}>Copied full ID</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#eef1f0',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1f4d3d',
    fontWeight: '600',
  },
  copied: {
    fontSize: 10,
    color: '#2f8f5b',
    marginTop: 2,
  },
});
