import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

interface PrepNoteBoxProps {
  note: string;
  onNoteChange: (note: string) => void;
  onClear: () => void;
}

const PrepNoteBox: React.FC<PrepNoteBoxProps> = ({ note, onNoteChange, onClear }) => {
  const [expanded, setExpanded] = useState(!!note);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleExpanded} style={styles.headerButton}>
          <Text style={styles.headerText}>
            {expanded ? 'Hide Notes' : 'Show Notes'}
          </Text>
        </TouchableOpacity>
        {expanded && note.trim() !== '' && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <X size={16} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      {expanded && (
        <View style={styles.noteContainer}>
          <TextInput
            style={styles.noteInput}
            multiline
            value={note}
            onChangeText={onNoteChange}
            placeholder="Add notes about prep status (e.g., tomato sauce is halfway done, just some tomatoes are chopped)"
            placeholderTextColor="#999"
            autoCapitalize="sentences"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  headerButton: {
    flex: 1,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  clearButton: {
    padding: 4,
  },
  noteContainer: {
    padding: 8,
  },
  noteInput: {
    minHeight: 80,
    padding: 8,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
  },
});

export default PrepNoteBox;