import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";

export interface CommentModalProps {
  visible: boolean;
  initialValue: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  initialValue,
  onSave,
  onCancel,
}) => {
  const [text, setText] = useState(initialValue);

  useEffect(() => {
    setText(initialValue); // reset when modal opens
  }, [initialValue, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Edit Comment</Text>
          <TextInput
            style={styles.input}
            multiline
            value={text}
            onChangeText={setText}
            placeholder="Enter your comment here..."
          />
          <View style={styles.buttons}>
            <Button title="Cancel" onPress={onCancel} />
            <Button title="Save" onPress={() => onSave(text)} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
});

export default CommentModal;
