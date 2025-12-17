// ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { router, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

type Message = {
  type: 'ai' | 'user';
  text: string;
  time: string;
};

interface ChatScreenProps {
  onClose: () => void;
}

const BACKEND_BASE = 'http://localhost:8000';

// Replace with your actual user id or remove and use Authorization header in production.

// -----------------------------------

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      text: "Hi Sarah! I'm Fin-AI, your personal finance assistant. How can I help you today?",
      time: 'Just now',
    },
  ]);

  const quickActions = [
    'Show my spending this month',
    'When is my next bill due?',
    'How can I save more?',
    'Optimize my credit cards',
  ];

  const flatListRef = useRef<FlatList<Message> | null>(null);
  const router = useRouter();
  const onClose = () => {
    router.push("/")
  };

  const { user } = useAuth();
  const DEMO_USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';

  useEffect(() => {
    // Scroll to bottom whenever messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [messages]);

  // --- New: helper to post to backend /api/chat
  async function postToChatBackend(userId: string | null, userMessage: string) {
    const url = `${BACKEND_BASE}/api/chat`;
    const body: any = { message: userMessage };
    body.userId = user?.id ?? '693a0451e654cdaccbb42d26';;

    // If you have other info (monthlyIncome etc) include here:
    // body.monthlyIncome = 4500;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In production use Authorization header: Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Server returned ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    // expected shape: { ok: true, reply: "..." } (server code)
    // be defensive if server returns plain { reply } or { message }
    return json?.reply ?? json?.message ?? (typeof json === 'string' ? json : JSON.stringify(json));
  }

  const handleSend = async () => {
    if (!message.trim()) return;

    const userText = message.trim();
    const userMsg: Message = { type: 'user', text: userText, time: 'Just now' };
    // append user message and clear input
    setMessages(prev => [...prev, userMsg]);
    setMessage('');

    // add temporary AI "Thinking..." message
    const thinkingMsgId = `thinking-${Date.now()}`;
    setMessages(prev => [...prev, { type: 'ai', text: 'Thinking...', time: 'Just now' }]);

    try {
      const replyText = await postToChatBackend(DEMO_USER_ID, userText);

      // replace last "Thinking..." with actual reply
      setMessages(prev => {
        const copy = [...prev];
        // find last "Thinking..." index (safe)
        const idx = copy.map(m => m.text).lastIndexOf('Thinking...');
        if (idx >= 0) {
          copy.splice(idx, 1, { type: 'ai', text: replyText, time: 'Just now' });
        } else {
          copy.push({ type: 'ai', text: replyText, time: 'Just now' });
        }
        return copy;
      });
    } catch (err: any) {
      console.error('chat error', err);
      setMessages(prev => {
        const copy = [...prev];
        const idx = copy.map(m => m.text).lastIndexOf('Thinking...');
        if (idx >= 0) {
          copy.splice(idx, 1, { type: 'ai', text: 'Failed to reach server', time: 'Just now' });
        } else {
          copy.push({ type: 'ai', text: 'Failed to reach server', time: 'Just now' });
        }
        return copy;
      });
    }
  };

  const handleQuickAction = (action: string) => {
    // populate the input then send shortly after
    setMessage(action);
    // small delay to allow UI to update
    setTimeout(() => {
      handleSend();
    }, 120);
  };

  const onSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    // On mobile the multiline TextInput may not call this; but if user presses submit, send
    handleSend();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
        <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
          {!isUser && (
            <View style={styles.aiHeader}>
              <View style={styles.aiAvatar}>
                <MaterialIcons name="auto-awesome" size={14} color="white" />
              </View>
              <Text style={styles.aiName}>Fin-AI</Text>
            </View>
          )}

          <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.aiBubbleText]}>{item.text}</Text>
          </View>

          <Text style={[styles.timeText, isUser ? styles.timeRight : styles.timeLeft]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <LinearGradient colors={['#0fd6b9', '#0e9f9a']} style={styles.header}>
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="auto-awesome" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.title}>Fin-AI Assistant</Text>
                <Text style={styles.subtitle}>Always here to help</Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color="white" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Messages */}
        <View style={styles.messagesWrap}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, idx) => String(idx)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
          // inversion not used; we append normally and scrollToEnd
          />

          {/* Quick actions shown only when only initial AI message exists */}
          {messages.length === 1 && (
            <View style={styles.quickActionsWrap}>
              <Text style={styles.quickActionsLabel}>Quick actions:</Text>
              <View style={styles.quickList}>
                {quickActions.map((action, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickBtn}
                    onPress={() => handleQuickAction(action)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickBtnText}>{action}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Ask me anything..."
            placeholderTextColor="#9CA3AF"
            multiline
            onSubmitEditing={onSubmitEditing}
            style={styles.textInput}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim()}
            style={[styles.sendBtn, message.trim() ? styles.sendBtnActive : styles.sendBtnDisabled]}
            activeOpacity={0.8}
          >
            <Feather name="send" size={20} color={message.trim() ? 'white' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1 },
  header: {
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#D1FAE5', fontSize: 12 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  messagesWrap: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  messagesContent: { paddingBottom: 8 },
  messageRow: { marginVertical: 6, flexDirection: 'row' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageContainer: { maxWidth: '80%' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  aiAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiName: { fontSize: 12, color: '#6B7280' },
  bubble: { padding: 12, borderRadius: 16 },
  aiBubble: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  userBubble: {
    backgroundColor: '#0EA5A4',
    borderTopRightRadius: 6,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  aiBubbleText: { color: '#111827' },
  userBubbleText: { color: '#FFFFFF' },
  timeText: { fontSize: 11, marginTop: 6, color: '#9CA3AF' },
  timeLeft: { textAlign: 'left' },
  timeRight: { textAlign: 'right' },

  quickActionsWrap: { marginTop: 12 },
  quickActionsLabel: { textAlign: 'center', color: '#6B7280', marginBottom: 8 },
  quickList: { gap: 8 },
  quickBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 8,
  },
  quickBtnText: { color: '#374151', fontSize: 14 },

  composer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    fontSize: 15,
    color: '#111827',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#0EA5A4',
  },
  sendBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },

  aiMessageContainer: {
    alignItems: 'flex-start',
  },
});
