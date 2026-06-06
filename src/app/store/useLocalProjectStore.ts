import { create } from 'zustand';

const DB_NAME = 'gemma_codebase_db';
const STORE_NAME = 'project_directories';
const FILE_STORE = 'file_contents';

// Utility helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// IndexedDB Directory Handle getters/setters
export async function getDirectoryHandle(projectId: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(projectId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveDirectoryHandle(projectId: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(handle, projectId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDirectoryHandle(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(projectId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// IndexedDB File Cache getters/setters
export async function getCachedFile(
  projectId: string,
  path: string
): Promise<{ content: string; size: number; lastModified: number } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, 'readonly');
      const store = tx.objectStore(FILE_STORE);
      const req = store.get(`${projectId}:${path}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveCachedFile(
  projectId: string,
  path: string,
  fileData: { content: string; size: number; lastModified: number }
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite');
    const store = tx.objectStore(FILE_STORE);
    const req = store.put(fileData, `${projectId}:${path}`);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearProjectFilesCache(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite');
    const store = tx.objectStore(FILE_STORE);
    const req = store.openKeyCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const key = cursor.key as string;
        if (key.startsWith(`${projectId}:`)) {
          store.delete(key);
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

export interface IndexedFile {
  path: string;
  size: number;
  lastModified: number;
}

interface LocalProjectState {
  activeDirectoryHandle: FileSystemDirectoryHandle | null;
  directoryPermissionStatus: 'prompt' | 'granted' | 'denied';
  isIndexing: boolean;
  indexedFiles: IndexedFile[];
  projectSummary: { framework: string; structureSummary: string } | null;
  attachedFiles: string[]; // Paths of attached files for prompts
  indexingProgress: { current: number; total: number };
  fileTree: FileNode[];
  chatWithCodebase: boolean;

  // Actions
  selectDirectory: (projectId: string) => Promise<boolean>;
  loadSavedDirectory: (projectId: string) => Promise<boolean>;
  requestDirectoryPermission: () => Promise<boolean>;
  disconnectDirectory: (projectId: string) => Promise<void>;
  scanDirectory: (projectId: string) => Promise<void>;
  toggleFileAttachment: (path: string) => void;
  clearAttachments: () => void;
  setChatWithCodebase: (val: boolean) => void;
  searchCodebase: (projectId: string, query: string) => Promise<Array<{ path: string; score: number; preview: string }>>;
}

// Helpers for file filtering
const EXCLUDE_DIRS = new Set([
  '.git', 'node_modules', '.next', '.gemini', 'dist', 'build', 'out', 'bin', 'obj', 'venv', '.venv', 'tmp', 'temp'
]);

const BINARY_EXTENSIONS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'tiff', 'bmp', 'psd',
  // Audio/Video
  'mp3', 'wav', 'ogg', 'mp4', 'mov', 'avi', 'mkv', 'webm',
  // Archives
  'zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // Executables/Binaries
  'exe', 'dll', 'so', 'dylib', 'bin', 'out', 'app',
  // Fonts
  'woff', 'woff2', 'eot', 'ttf', 'otf',
  // Database/Other binaries
  'db', 'sqlite', 'sqlite3', 'pcode', 'pyc', 'wasm'
]);

const EXCLUDE_FILENAMES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'tsconfig.tsbuildinfo'
]);

function getFileExtension(filename: string): string {
  if (!filename.includes('.')) return '';
  if (filename.startsWith('.') && filename.split('.').length === 2) {
    return filename.slice(1).toLowerCase();
  }
  return filename.split('.').pop()?.toLowerCase() || '';
}

function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = [];
  const map: Record<string, FileNode> = {};

  files.forEach((filePath) => {
    const parts = filePath.split('/');
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isDir = index < parts.length - 1;

      if (!map[currentPath]) {
        const node: FileNode = {
          name: part,
          path: currentPath,
          isDir,
          ...(isDir ? { children: [] } : {})
        };
        map[currentPath] = node;

        if (index === 0) {
          root.push(node);
        } else {
          const parentPath = parts.slice(0, index).join('/');
          map[parentPath].children?.push(node);
        }
      }
    });
  });

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children);
    });
  };
  sortNodes(root);
  return root;
}

export const useLocalProjectStore = create<LocalProjectState>((set, get) => ({
  activeDirectoryHandle: null,
  directoryPermissionStatus: 'prompt',
  isIndexing: false,
  indexedFiles: [],
  projectSummary: null,
  attachedFiles: [],
  indexingProgress: { current: 0, total: 0 },
  fileTree: [],
  chatWithCodebase: false,

  selectDirectory: async (projectId) => {
    if (typeof window === 'undefined' || !(window as any).showDirectoryPicker) {
      alert('Your browser does not support the File System Access API. Please use Chrome, Edge, or Safari.');
      return false;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await saveDirectoryHandle(projectId, handle);
      set({ 
        activeDirectoryHandle: handle, 
        directoryPermissionStatus: 'granted',
        attachedFiles: []
      });
      // Trigger scan in background
      get().scanDirectory(projectId);
      return true;
    } catch (err) {
      console.warn('Directory picker cancelled or failed:', err);
      return false;
    }
  },

  loadSavedDirectory: async (projectId) => {
    const handle = await getDirectoryHandle(projectId);
    if (!handle) {
      set({ 
        activeDirectoryHandle: null, 
        directoryPermissionStatus: 'prompt',
        indexedFiles: [],
        fileTree: [],
        projectSummary: null,
        attachedFiles: []
      });
      return false;
    }

    try {
      const state = await (handle as any).queryPermission({ mode: 'readwrite' });
      set({ activeDirectoryHandle: handle, directoryPermissionStatus: state });
      
      if (state === 'granted') {
        // Trigger background load/index scan
        get().scanDirectory(projectId);
        return true;
      }
      return false;
    } catch {
      set({ directoryPermissionStatus: 'prompt' });
      return false;
    }
  },

  requestDirectoryPermission: async () => {
    const { activeDirectoryHandle } = get();
    if (!activeDirectoryHandle) return false;

    try {
      const state = await (activeDirectoryHandle as any).requestPermission({ mode: 'readwrite' });
      set({ directoryPermissionStatus: state });
      if (state === 'granted') {
        const savedProjects = localStorage.getItem('gemma_projects');
        const activeProj = savedProjects ? JSON.parse(savedProjects)[0] : null;
        if (activeProj) {
          get().scanDirectory(activeProj.id);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Permission request failed:', err);
      return false;
    }
  },

  disconnectDirectory: async (projectId) => {
    await deleteDirectoryHandle(projectId);
    await clearProjectFilesCache(projectId);
    set({
      activeDirectoryHandle: null,
      directoryPermissionStatus: 'prompt',
      indexedFiles: [],
      fileTree: [],
      projectSummary: null,
      attachedFiles: []
    });
  },

  scanDirectory: async (projectId) => {
    const { activeDirectoryHandle, isIndexing } = get();
    if (!activeDirectoryHandle || isIndexing) return;

    set({ isIndexing: true, indexingProgress: { current: 0, total: 0 } });

    const files: IndexedFile[] = [];
    const filesToRead: Array<{ path: string; fileHandle: FileSystemFileHandle }> = [];

    // Helper to recursively collect files with nested try-catch safety
    async function collect(dirHandle: any, currentPath = '') {
      try {
        for await (const entry of dirHandle.values()) {
          try {
            if (entry.kind === 'directory') {
              if (EXCLUDE_DIRS.has(entry.name)) continue;
              const subPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
              // Explicitly get the directory handle for the subdirectory
              let subHandle;
              try {
                subHandle = await dirHandle.getDirectoryHandle(entry.name);
              } catch {
                subHandle = entry;
              }
              await collect(subHandle, subPath);
            } else if (entry.kind === 'file') {
              if (EXCLUDE_FILENAMES.has(entry.name)) continue;

              const extension = getFileExtension(entry.name);
              if (BINARY_EXTENSIONS.has(extension)) continue;

              let file;
              try {
                file = await entry.getFile();
              } catch (fileErr) {
                // Try to get the file handle explicitly from parent directory
                try {
                  const fileHandle = await dirHandle.getFileHandle(entry.name);
                  file = await fileHandle.getFile();
                } catch {
                  console.warn(`Failed to resolve file handle for ${entry.name}:`, fileErr);
                  continue;
                }
              }

              if (!file) continue;

              // Skip files larger than 1MB
              if (file.size > 1024 * 1024) continue;

              const relativePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
              filesToRead.push({ path: relativePath, fileHandle: entry });
              files.push({
                path: relativePath,
                size: file.size,
                lastModified: file.lastModified
              });
            }
          } catch (entryErr) {
            console.warn(`Error processing entry in directory ${currentPath}:`, entryErr);
          }
        }
      } catch (dirErr) {
        console.warn(`Error reading directory ${currentPath}:`, dirErr);
      }
    }

    try {
      await collect(activeDirectoryHandle);
      
      let currentIdx = 0;
      const totalFiles = filesToRead.length;
      set({ indexingProgress: { current: 0, total: totalFiles } });

      let framework = 'Plain Web Project';
      let packageJsonContent = '';

      // Read files content and update IndexedDB cache
      for (const item of filesToRead) {
        currentIdx++;
        set({ indexingProgress: { current: currentIdx, total: totalFiles } });

        try {
          const file = await item.fileHandle.getFile();
          
          // Check if cached file is still fresh
          const cached = await getCachedFile(projectId, item.path);
          if (cached && cached.lastModified === file.lastModified && cached.size === file.size) {
            if (item.path === 'package.json') {
              packageJsonContent = cached.content;
            }
            continue;
          }

          // Otherwise read content
          const text = await file.text();
          await saveCachedFile(projectId, item.path, {
            content: text,
            size: file.size,
            lastModified: file.lastModified
          });

          if (item.path === 'package.json') {
            packageJsonContent = text;
          }
        } catch (fileErr) {
          console.warn(`Failed to read file contents for ${item.path}:`, fileErr);
          // Remove from successfully indexed files list
          const idx = files.findIndex(f => f.path === item.path);
          if (idx !== -1) {
            files.splice(idx, 1);
          }
        }
      }

      // Framework auto-detection
      if (packageJsonContent) {
        try {
          const parsed = JSON.parse(packageJsonContent);
          const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
          if (deps['next']) {
            framework = 'Next.js (React)';
          } else if (deps['react']) {
            framework = 'React.js Client App';
          } else if (deps['express'] || deps['koa'] || deps['fastify']) {
            framework = 'Node.js Backend';
          } else if (deps['vue']) {
            framework = 'Vue.js Application';
          } else {
            framework = 'Node.js / JS Project';
          }
        } catch {}
      }

      // Create structure summary outline
      const summaryText = `Project Structure:
- Total Indexed Files: ${files.length}
- Tech Stack: ${framework}
- Primary directories found: ${Array.from(new Set(files.map(f => f.path.split('/')[0]))).filter(d => d && !d.includes('.')).join(', ')}`;

      const filePaths = files.map((f) => f.path);
      set({
        indexedFiles: files,
        fileTree: buildFileTree(filePaths),
        projectSummary: { framework, structureSummary: summaryText },
        isIndexing: false
      });
    } catch (err) {
      console.warn('Failed to scan codebase directory:', err);
      set({ isIndexing: false });
    }
  },

  toggleFileAttachment: (path) => {
    set((state) => {
      const exists = state.attachedFiles.includes(path);
      const updated = exists
        ? state.attachedFiles.filter((p) => p !== path)
        : [...state.attachedFiles, path];
      return { attachedFiles: updated };
    });
  },

  clearAttachments: () => set({ attachedFiles: [] }),

  setChatWithCodebase: (val) => set({ chatWithCodebase: val }),

  searchCodebase: async (projectId, query) => {
    const { indexedFiles } = get();
    if (indexedFiles.length === 0 || !query.trim()) return [];

    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (terms.length === 0) return [];

    const results: Array<{ path: string; score: number; preview: string }> = [];

    for (const file of indexedFiles) {
      const cached = await getCachedFile(projectId, file.path);
      if (!cached) continue;

      const contentLower = cached.content.toLowerCase();
      const pathLower = file.path.toLowerCase();
      let score = 0;

      // Match score for path components
      terms.forEach((term) => {
        if (pathLower.includes(term)) score += 15;
      });

      // Match score for content counts
      terms.forEach((term) => {
        let idx = contentLower.indexOf(term);
        while (idx !== -1) {
          score += 1;
          idx = contentLower.indexOf(term, idx + 1);
        }
      });

      if (score > 0) {
        let firstMatchIndex = -1;
        for (const term of terms) {
          const idx = contentLower.indexOf(term);
          if (idx !== -1) {
            firstMatchIndex = idx;
            break;
          }
        }

        let preview = '';
        if (firstMatchIndex !== -1) {
          const start = Math.max(0, firstMatchIndex - 40);
          const end = Math.min(cached.content.length, firstMatchIndex + 80);
          preview =
            (start > 0 ? '...' : '') +
            cached.content.substring(start, end).replace(/\r?\n/g, ' ') +
            (end < cached.content.length ? '...' : '');
        } else {
          preview = cached.content.substring(0, 100).replace(/\r?\n/g, ' ') + '...';
        }

        results.push({ path: file.path, score, preview });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  }
}));
