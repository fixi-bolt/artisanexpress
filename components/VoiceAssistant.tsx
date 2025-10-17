import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useState, useRef } from 'react';
import Colors from '@/constants/colors';
import { Mic, StopCircle, Sparkles } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface VoiceAssistantProps {
  onTranscription: (text: string) => void;
  onAIAnalysis?: (analysis: { category?: string; urgency?: string; keywords?: string[] }) => void;
}

export default function VoiceAssistant({ onTranscription, onAIAnalysis }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        await startWebRecording();
      } else {
        await startMobileRecording();
      }
      setIsRecording(true);
      console.log('[Voice] Recording started');
    } catch (error) {
      console.error('[Voice] Failed to start recording:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const startWebRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
  };

  const startMobileRecording = async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {},
    });

    await recording.startAsync();
    recordingRef.current = recording;
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      if (Platform.OS === 'web') {
        await stopWebRecording();
      } else {
        await stopMobileRecording();
      }
    } catch (error) {
      console.error('[Voice] Failed to stop recording:', error);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement');
      setIsProcessing(false);
    }
  };

  const stopWebRecording = async () => {
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          await processAudio(audioBlob);
          resolve();
        };
        mediaRecorderRef.current.stop();
      }
    });
  };

  const stopMobileRecording = async () => {
    if (!recordingRef.current) return;

    await recordingRef.current.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    
    const uri = recordingRef.current.getURI();
    if (uri) {
      await processAudioFromUri(uri);
    }
    recordingRef.current = null;
  };

  const processAudioFromUri = async (uri: string) => {
    try {
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any);

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleTranscription(data.text);
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error('[Voice] Processing error:', error);
      Alert.alert('Erreur', 'Impossible de transcrire l\'audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleTranscription(data.text);
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error('[Voice] Processing error:', error);
      Alert.alert('Erreur', 'Impossible de transcrire l\'audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranscription = async (text: string) => {
    console.log('[Voice] Transcription:', text);
    onTranscription(text);

    if (onAIAnalysis) {
      try {
        const analysis = analyzeText(text);
        onAIAnalysis(analysis);
      } catch (error) {
        console.error('[Voice] Analysis error:', error);
      }
    }
  };

  const analyzeText = (text: string): { category?: string; urgency?: string; keywords?: string[] } => {
    const lowerText = text.toLowerCase();
    
    const categoryKeywords: Record<string, string[]> = {
      plumber: ['fuite', 'eau', 'robinet', 'tuyau', 'canalisation', 'évier', 'toilette', 'chauffe-eau'],
      electrician: ['électrique', 'courant', 'prise', 'disjoncteur', 'lumière', 'câble', 'interrupteur'],
      locksmith: ['serrure', 'clé', 'porte', 'verrou', 'cadenas', 'blindée'],
      painter: ['peinture', 'mur', 'plafond', 'repeindre', 'couleur'],
      cleaner: ['ménage', 'nettoyage', 'propre', 'sale', 'nettoyer'],
    };

    const urgencyKeywords = {
      high: ['urgent', 'immédiat', 'rapidement', 'vite', 'tout de suite', 'dès que possible'],
      medium: ['bientôt', 'prochainement', 'cette semaine'],
      low: ['quand possible', 'pas urgent', 'temps'],
    };

    let detectedCategory: string | undefined;
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedCategory = category;
      }
    }

    let urgency: string | undefined;
    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        urgency = level;
        break;
      }
    }

    const keywords = lowerText.split(' ').filter(word => word.length > 4);

    return {
      category: detectedCategory,
      urgency,
      keywords: keywords.slice(0, 5),
    };
  };

  return (
    <View style={styles.container} testID="voiceAssistant">
      <View style={styles.header}>
        <Sparkles size={16} color={Colors.secondary} />
        <Text style={styles.label}>Assistant vocal IA</Text>
      </View>

      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        activeOpacity={0.8}
        testID="voiceRecordBtn"
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color={Colors.surface} />
        ) : isRecording ? (
          <>
            <StopCircle size={32} color={Colors.surface} />
            <Text style={styles.recordButtonText}>Arrêter</Text>
          </>
        ) : (
          <>
            <Mic size={32} color={Colors.surface} />
            <Text style={styles.recordButtonText}>Décrivez votre problème</Text>
          </>
        )}
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Enregistrement en cours...</Text>
        </View>
      )}

      {isProcessing && (
        <View style={styles.processingBox}>
          <Text style={styles.processingText}>🎙️ Transcription en cours...</Text>
        </View>
      )}

      <View style={styles.tip}>
        <Text style={styles.tipText}>
          💡 Exemple : &quot;J&apos;ai une fuite d&apos;eau sous mon évier dans la cuisine, c&apos;est urgent&quot;
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  recordButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  processingBox: {
    padding: 12,
    backgroundColor: Colors.info + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  processingText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
  },
  tip: {
    padding: 12,
    backgroundColor: Colors.warning + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '20',
  },
  tipText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
});
