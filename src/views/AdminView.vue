<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ChatWidget from '@/components/ChatWidget.vue';
import { useAuthStore } from '@/stores/useAuthStore';
import api from '@/utils/axios';

const authStore = useAuthStore();
const file = ref<File | null>(null);
const uploading = ref(false);
const documents = ref<{ id: number; filename: string; createdAt: string }[]>([]);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0] as File;
  }
};

const fetchDocuments = async () => {
  try {
    const response = await api.get('/api/admin/documents', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    documents.value = response.data;
  } catch (error) {
    console.error('Failed to fetch documents', error);
  }
};

const uploadDocument = async () => {
  if (!file.value) return;

  uploading.value = true;
  const formData = new FormData();
  formData.append('file', file.value);

  try {
    await api.post('/api/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${authStore.token}`
      }
    });
    alert('Document uploaded successfully');
    file.value = null;
    fetchDocuments();
  } catch (error) {
    console.error('Upload failed', error);
    alert('Upload failed');
  } finally {
    uploading.value = false;
  }
};

onMounted(() => {
  fetchDocuments();
});
</script>

<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Knowledge Dashboard</h1>

    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title">Upload Document</h2>
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text">Select a file (Text/PDF)</span>
          </label>
          <input type="file" @change="handleFileChange"
            class="file-input file-input-bordered rounded-full mt-2 outline-0 w-full max-w-xs" />
        </div>
        <div class="card-actions justify-start mt-4">
          <button @click="uploadDocument" class="btn btn-primary" :disabled="!file || uploading">
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Managed Documents</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Filename</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in documents" :key="doc.id">
                <td>{{ doc.id }}</td>
                <td>{{ doc.filename }}</td>
                <td>{{ new Date(doc.createdAt).toLocaleDateString() }}</td>
                <td>
                  <button class="btn btn-xs btn-error">Delete</button>
                </td>
              </tr>
              <tr v-if="documents.length === 0">
                <td colspan="4" class="text-center">No documents found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <ChatWidget :embedded="false" />
</template>
