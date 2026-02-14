<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue';
import { Send, MessageCircle, X, FileText } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/useAuthStore';

const props = defineProps<{
  embedded?: boolean;
}>();

const open = ref(props.embedded || false);
const message = ref('');
const messages = ref<{ text: string; sender: 'user' | 'bot'; sources?: string[] }[]>([]);
const loading = ref(false);
const authStore = useAuthStore();
const messagesContainer = ref<HTMLElement | null>(null);

const isOpen = computed(() => props.embedded || open.value);

const toggleChat = () => {
  if (props.embedded) return;
  open.value = !open.value;
  if (open.value) {
    nextTick(scrollToBottom);
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

watch(messages, () => {
  nextTick(scrollToBottom);
}, { deep: true });

const sendMessage = async () => {
  if (!message.value.trim() || loading.value) return;

  const userMessage = message.value;
  messages.value.push({ text: userMessage, sender: 'user' });
  message.value = '';
  loading.value = true;

  // Create a placeholder for the bot response
  const botMessageIndex = messages.value.push({ text: '', sender: 'bot', sources: [] }) - 1;
  nextTick(scrollToBottom);

  try {
    const token = authStore.token;
    const response = await fetch('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: userMessage })
    });

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialData = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      partialData += chunk;

      const lines = partialData.split('\n\n');
      partialData = lines.pop() || ''; // Keep the last incomplete line

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          continue;
        }
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '');
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (Array.isArray(data) && messages.value[botMessageIndex]) {
              messages.value[botMessageIndex].sources = data;
            } else if (data.text && messages.value[botMessageIndex]) {
              messages.value[botMessageIndex].text += data.text;
            } else if (data.error && messages.value[botMessageIndex]) {
              messages.value[botMessageIndex].text = "Error: " + data.error;
            }

          } catch (e) {
            console.error('Failed to parse SSE data', e);
          }
        }
      }
      scrollToBottom();
    }

  } catch (error) {
    console.error(error);
    if (messages.value[botMessageIndex]) {
      messages.value[botMessageIndex].text += '\n[Sorry, I encountered an error.]';
    }
  } finally {
    loading.value = false;
    nextTick(scrollToBottom);
  }
};
</script>

<template>
  <div :class="[embedded ? 'w-full h-full' : 'fixed bottom-4 right-4 z-50']">
    <button v-if="!embedded && !isOpen" @click="toggleChat" class="btn btn-circle btn-primary btn-lg shadow-lg">
      <MessageCircle :size="32" />
    </button>

    <div v-show="isOpen" :class="[
      'card bg-base-100 shadow-xl border border-gray-700 flex flex-col',
      embedded ? 'w-full h-full rounded-none border-0' : 'w-80 sm:w-96 rounded-xl'
    ]">
      <div v-if="!embedded" class="card-header p-4 bg-base-200 rounded-t-xl flex justify-between items-center">
        <h3 class="font-bold">AI Chatbot</h3>
        <button @click="toggleChat" class="btn btn-ghost btn-xs btn-circle">
          <X :size="18" />
        </button>
      </div>

      <div class="card-body p-4 flex-1 overflow-y-auto" :class="{ 'h-96': !embedded }" ref="messagesContainer">
        <div v-if="messages.length === 0" class="text-center text-gray-500 mt-20">
          <h3 class="font-bold text-lg mb-2">How can I help?</h3>
          <p class="text-sm">Ask me about the documents you've uploaded.</p>
        </div>

        <div v-for="(msg, index) in messages" :key="index"
          :class="['chat', msg.sender === 'user' ? 'chat-end' : 'chat-start']">
          <div class="chat-image avatar" v-if="msg.sender === 'bot'">
            <div class="w-10 rounded-full bg-primary flex items-center justify-center text-primary-content">
              <span>AI</span>
            </div>
          </div>
          <div :class="['chat-bubble', msg.sender === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary']">
            <span class="whitespace-pre-wrap">{{ msg.text }}</span>
            <span v-if="msg.sender === 'bot' && loading && index === messages.length - 1 && !msg.text"
              class="loading loading-dots loading-xs ml-2"></span>
          </div>
          <div v-if="msg.sources && msg.sources.length" class="chat-footer opacity-50 text-xs mt-1">
            <div class="dropdown dropdown-top dropdown-hover">
              <div tabindex="0" role="button" class="flex items-center gap-1 cursor-pointer hover:text-primary">
                <FileText :size="12" /> {{ msg.sources.length }} Sources
              </div>
              <div tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-52">
                <div v-for="(source, i) in msg.sources" :key="i"
                  class="text-xs p-1 border-b border-gray-600 last:border-0">
                  {{ source.substring(0, 100) }}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer p-4 bg-base-200" :class="{ 'rounded-b-xl': !embedded }">
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <input type="text" v-model="message" placeholder="Type a message..."
            class="input input-bordered rounded-full outline-0 w-full p-4"
            :disabled="loading && !messages[messages.length - 1]?.text" />
          <button type="submit" class="btn btn-primary rounded-full"
            :disabled="loading && !messages[messages.length - 1]?.text">
            <Send :size="18" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
