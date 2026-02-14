<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ChatWidget from '@/components/ChatWidget.vue';
import { useAuthStore } from '@/stores/useAuthStore';
import api from '@/utils/axios';
import {
  Upload,
  FileText,
  Trash2,
  Search,
  Download,
  RefreshCw,
  Database,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  MoreVertical,
  Filter
} from 'lucide-vue-next';

const authStore = useAuthStore();
const file = ref<File | null>(null);
const uploading = ref(false);
const documents = ref<{ id: number; filename: string; createdAt: string; size?: number; status?: string }[]>([]);
const searchQuery = ref('');
const selectedDoc = ref<{ id: number; filename: string; content?: string } | null>(null);
const showPreviewModal = ref(false);
const loading = ref(false);
const filterStatus = ref('all');
const sortBy = ref('newest');
const dragActive = ref(false);

const filteredDocuments = computed(() => {
  let filtered = documents.value.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(doc => doc.status === filterStatus.value);
  }

  return filtered.sort((a, b) => {
    if (sortBy.value === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy.value === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy.value === 'name') {
      return a.filename.localeCompare(b.filename);
    }
    return 0;
  });
});

const stats = computed(() => ({
  total: documents.value.length,
  processed: documents.value.filter(d => d.status === 'processed').length,
  pending: documents.value.filter(d => d.status === 'pending').length,
  failed: documents.value.filter(d => d.status === 'failed').length
}));

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0] as File;
  }
};

const fetchDocuments = async () => {
  loading.value = true;
  try {
    const response = await api.get('/api/admin/documents', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    documents.value = response.data.map((doc: any) => ({
      ...doc,
      status: ['processed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
      size: Math.floor(Math.random() * 1000000) + 10000
    }));
  } catch (error) {
    console.error('Failed to fetch documents', error);
  } finally {
    loading.value = false;
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

    const notification = document.createElement('div');
    notification.className = 'alert alert-success fixed top-4 right-4 z-50 w-auto shadow-lg animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <CheckCircle class="w-5 h-5" />
        <span>Document uploaded successfully</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);

    file.value = null;
    fetchDocuments();
  } catch (error) {
    console.error('Upload failed', error);

    const notification = document.createElement('div');
    notification.className = 'alert alert-error fixed top-4 right-4 z-50 w-auto shadow-lg animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <AlertCircle class="w-5 h-5" />
        <span>Upload failed. Please try again.</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  } finally {
    uploading.value = false;
  }
};

const deleteDocument = async (id: number) => {
  if (!confirm('Are you sure you want to delete this document?')) return;

  try {
    await api.delete(`/api/admin/documents/${id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    documents.value = documents.value.filter(doc => doc.id !== id);

    const notification = document.createElement('div');
    notification.className = 'alert alert-success fixed rounded top-4 right-4 z-50 w-100 h-auto shadow-lg animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <CheckCircle class="h-5" />
        <span>Document deleted successfully</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  } catch (error) {
    console.error('Delete failed', error);
  }
};

const previewDocument = async (doc: { id: number; filename: string }) => {
  selectedDoc.value = { ...doc };
  showPreviewModal.value = true;
  // try {
  //   const response = await api.get(`/api/admin/documents/${doc.id}/content`);
  //   selectedDoc.value.content = response.data.content;
  // } catch (error) {
  //   console.error('Failed to fetch document content', error);
  // }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  dragActive.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragActive.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  dragActive.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    // Optional: Add file type validation
    const droppedFile = files[0]!;
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (validTypes.includes(droppedFile.type)) {
      file.value = droppedFile;

      // Optional: Show success notification for dropped file
      const notification = document.createElement('div');
      notification.className = 'alert alert-success fixed top-4 right-4 z-50 w-auto shadow-lg animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <CheckCircle class="w-5 h-5" />
          <span>File "${droppedFile.name}" ready to upload</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } else {
      // Show error for invalid file type
      const notification = document.createElement('div');
      notification.className = 'alert alert-error rounded fixed top-4 right-4 z-50 w-100 h-auto shadow-lg animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center text-white gap-2">
          <AlertCircle class="h-5" />
          <span>Upload failed. Please try again.</span>
        </div>
        `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }


  }
}
onMounted(() => {
  fetchDocuments();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
    <!-- Header -->
    <div class="bg-base-100/80 backdrop-blur-sm sticky top-0 z-40 border-b border-base-300">
      <div class="container mx-auto px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <Database :size="20" class="text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold">Knowledge Dashboard</h1>
              <p class="text-sm text-base-content/60">Manage and monitor your document knowledge base</p>
            </div>
          </div>
          <button class="btn btn-outline btn-sm gap-2" @click="fetchDocuments" :disabled="loading">
            <RefreshCw :size="16" :class="{ 'animate-spin': loading }" />
            Refresh
          </button>
        </div>
      </div>
    </div>

    <div class="container mx-auto p-8">
      <!-- Stats Cards -->
      <!-- TODO: First implement status API -->
      <!-- 
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="card-body p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">Total Documents</p>
                <p class="text-3xl font-bold">{{ stats.total }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Database :size="24" class="text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="card-body p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">Processed</p>
                <p class="text-3xl font-bold text-success">{{ stats.processed }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle :size="24" class="text-success" />
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="card-body p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">Pending</p>
                <p class="text-3xl font-bold text-warning">{{ stats.pending }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock :size="24" class="text-warning" />
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="card-body p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">Failed</p>
                <p class="text-3xl font-bold text-error">{{ stats.failed }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <AlertCircle :size="24" class="text-error" />
              </div>
            </div>
          </div>
        </div>
      </div>
-->

      <!-- Upload Section -->
      <div
        class="card bg-gradient-to-r from-primary/5 to-secondary/5 shadow-xl mb-8 border-2 border-dashed transition-all duration-300"
        :class="{ 'border-primary scale-[1.02]': dragActive, 'border-base-300': !dragActive }"
        @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
        <div class="card-body p-8">
          <div class="flex flex-col items-center text-center">
            <div
              class="w-20 h-20 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
              <Upload :size="32" class="text-primary" />
            </div>
            <h2 class="text-2xl font-bold mb-2">Upload Document</h2>
            <p class="text-base-content/60 mb-6 max-w-md">
              Drag and drop your files here, or click to browse. Supports PDF, TXT, DOCX (Max 10MB)
            </p>

            <div class="flex flex-col items-center gap-4 w-full max-w-md">
              <input type="file" @change="handleFileChange"
                class="file-input file-input-bordered file-input-primary w-full" accept=".pdf,.txt,.docx"
                :disabled="uploading" />

              <div v-if="file" class="flex items-center gap-2 p-3 bg-base-200 rounded-lg w-full">
                <FileText :size="20" class="text-primary" />
                <span class="flex-1 text-left text-sm truncate">{{ file.name }}</span>
                <span class="text-xs text-base-content/60">{{ (file.size / 1024).toFixed(1) }} KB</span>
                <button class="btn btn-ghost btn-xs btn-circle" @click="file = null">
                  <X :size="14" />
                </button>
              </div>

              <button @click="uploadDocument" class="btn btn-primary gap-2 w-full" :class="{ 'loading': uploading }"
                :disabled="!file || uploading">
                <Upload :size="18" v-if="!uploading" />
                {{ uploading ? 'Uploading...' : 'Upload Document' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents List -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body p-6">
          <!-- Header with filters -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 class="card-title text-xl">
              <FileText :size="20" class="mr-2" />
              Managed Documents
            </h2>

            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <!-- Search -->
              <div class="form-control">
                <div class="input-group">
                  <input type="text" v-model="searchQuery" placeholder="Search documents..."
                    class="input input-bordered input-sm w-full sm:w-64" />
                  <button class="btn btn-square btn-sm">
                    <Search :size="16" />
                  </button>
                </div>
              </div>

              <!-- Filter dropdown -->
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-outline btn-sm gap-2">
                  <Filter :size="16" />
                  Filter
                </label>
                <div tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48">
                  <li><a :class="{ 'active': filterStatus === 'all' }" @click="filterStatus = 'all'">All</a></li>
                  <li><a :class="{ 'active': filterStatus === 'processed' }"
                      @click="filterStatus = 'processed'">Processed</a></li>
                  <li><a :class="{ 'active': filterStatus === 'pending' }" @click="filterStatus = 'pending'">Pending</a>
                  </li>
                  <li><a :class="{ 'active': filterStatus === 'failed' }" @click="filterStatus = 'failed'">Failed</a>
                  </li>
                </div>
              </div>

              <!-- Sort dropdown -->
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-outline btn-sm gap-2">
                  Sort by: {{ sortBy }}
                </label>
                <div tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                  <li><a :class="{ 'active': sortBy === 'newest' }" @click="sortBy = 'newest'">Newest</a></li>
                  <li><a :class="{ 'active': sortBy === 'oldest' }" @click="sortBy = 'oldest'">Oldest</a></li>
                  <li><a :class="{ 'active': sortBy === 'name' }" @click="sortBy = 'name'">Name</a></li>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Filename</th>
                  <th>Created</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in filteredDocuments" :key="doc.id" class="hover:bg-base-200 transition-colors">
                  <td class="font-mono text-sm">#{{ doc.id }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <FileText :size="16" class="text-primary" />
                      <span class="font-medium">{{ doc.filename }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-1 text-sm">
                      <Clock :size="14" class="text-base-content/40" />
                      {{ formatDate(doc.createdAt) }}
                    </div>
                  </td>
                  <td class="text-right">
                    <div class="flex justify-end gap-2">
                      <button class="btn btn-ghost btn-xs btn-circle tooltip" data-tip="Preview"
                        @click="previewDocument(doc)">
                        <Eye :size="14" />
                      </button>
                      <button class="btn btn-ghost btn-xs btn-circle tooltip" data-tip="Download">
                        <Download :size="14" />
                      </button>
                      <button class="btn btn-ghost btn-xs btn-circle text-error tooltip" data-tip="Delete"
                        @click="deleteDocument(doc.id)">
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredDocuments.length === 0">
                  <td colspan="6" class="text-center py-12">
                    <div class="flex flex-col items-center gap-2">
                      <FileText :size="40" class="text-base-content/20" />
                      <p class="text-base-content/60">No documents found</p>
                      <button class="btn btn-primary btn-sm" @click="() => { }">Upload your first document</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer with pagination info -->
          <div class="flex justify-between items-center mt-4 text-sm text-base-content/60">
            <p>Showing {{ filteredDocuments.length }} of {{ documents.length }} documents</p>
            <div class="btn-group">
              <button class="btn btn-sm" disabled>Previous</button>
              <button class="btn btn-sm btn-active">1</button>
              <button class="btn btn-sm" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <dialog :open="showPreviewModal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <FileText :size="20" class="text-primary" />
          {{ selectedDoc?.filename }}
        </h3>
        <div class="py-4">
          <p class="text-sm text-base-content/70 mb-4">Document preview content would appear here.</p>
          <div class="bg-base-200 p-4 rounded-lg max-h-96 overflow-y-auto">
            <p class="text-sm">Sample document content...</p>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn" @click="showPreviewModal = false">Close</button>
          </form>
        </div>
      </div>
    </dialog>

    <ChatWidget :embedded="false" />
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

/* Modal styles */
.modal {
  @apply fixed flex items-center justify-center opacity-0 pointer-events-none transition-opacity;
}

.modal[open] {
  @apply opacity-100 pointer-events-auto;
}

.modal-box {
  @apply w-full transform scale-95 transition-transform;
}

.modal[open] .modal-box {
  @apply scale-100;
}

/* Tooltip styles */
.tooltip {
  @apply relative;
}


/* Table row hover effect */
tr {
  transition: all 0.2s ease;
}

/* Input group styling */
.input-group {
  @apply flex;
}

.input-group input {
  @apply rounded-r-none;
}

.input-group button {
  @apply rounded-l-none;
}

/* Badge animations */
.badge {
  @apply transition-all duration-300;
}

/* Card hover effects */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
}
</style>
