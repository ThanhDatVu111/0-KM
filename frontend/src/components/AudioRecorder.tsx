import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CirclePlay, AudioLines } from 'lucide-react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUri, setAudioUri] = useState('');
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const getPermission = async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      alert('Permission to access microphone was denied');
    }
  };

  useEffect(() => {
    getPermission();
  }, []);

  const startRecording = () => {
    setRecording(true);
    audioRecorder.record();
  };
  const stopRecording = async () => {
    await audioRecorder.stop();
    setRecording(false);
    setAudioUri(audioRecorder.uri || '');
  };

  if (audioUri) {
    return (
      <View className="flex-row items-center">
        <Pressable
          style={{
            backgroundColor: recording ? '#F24187' : '#FFE4EC',
            borderWidth: 2,
            borderColor: '#220E6D',
            borderRadius: 24,
            width: 48,
            height: 48,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
          onPress={recording ? stopRecording : startRecording}
        >
          {recording ? (
            <CirclePlay size={24} color={'#FFE4EC'}></CirclePlay>
          ) : (
            <CirclePlay size={24} color={'#F24187'}></CirclePlay>
          )}
        </Pressable>

        {Array.from({ length: 10 }).map((_, index) => (
          <AudioLines key={index} size={24} color="black" />
        ))}
      </View>
    );
  }
}
