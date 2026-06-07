// ── State ──────────────────────────────────────────────────────────────────
const DB_KEY = 'notesapp_v1';

function loadDB() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || { stacks: {}, notes: {} };
  } catch {
    return { stacks: {}, notes: {} };
  }
}

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

let db = loadDB();
let currentStack = null;
let currentNote  = null;

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return '_' + Math.random().toString(36).slice(2, 9); }

function fmt(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-us', { month: 'short', day: 'numeric' });
}

function notesInStack(stackId) {
  return Object.entries(db.notes)
    .filter(([, n]) => n.stackId === stackId)
    .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
}

// ── Modal ────────────────────────────────────────────────────────────────────
function openModal({ title, body, confirmLabel, confirmClass = 'confirm', onConfirm }) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalOverlay').classList.add('open');

  const actions = document.getElementById('modalActions');
  actions.innerHTML = '';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'modal-btn cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = closeModal;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = `modal-btn ${confirmClass}`;
  confirmBtn.textContent = confirmLabel;
  confirmBtn.onclick = () => { closeModal(); onConfirm(); };

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);

  const inp = document.getElementById('modalInput');
  if (inp) {
    inp.focus();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') confirmBtn.click(); });
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  renderStacks();
  renderNotes();
  renderEditor();
}

function renderStacks() {
  const el = document.getElementById('stackList');
  el.innerHTML = '';
  Object.entries(db.stacks).forEach(([id, s]) => {
    const div = document.createElement('div');
    div.className = 'stack-item' + (currentStack === id ? ' active' : '');

    const name = document.createElement('span');
    name.className = 'stack-item-name';
    name.textContent = s.name;
    name.onclick = () => { currentStack = id; currentNote = null; render(); };

    const del = document.createElement('button');
    del.className = 'stack-del';
    del.textContent = '×';
    del.title = 'delete stack';
    del.onclick = (e) => { e.stopPropagation(); deleteStack(id); };

    div.appendChild(name);
    div.appendChild(del);
    el.appendChild(div);
  });
}

function renderNotes() {
  const label  = document.getElementById('notesLabel');
  const list   = document.getElementById('folderList');
  const newBtn = document.getElementById('newNoteBtn');
  list.innerHTML = '';

  if (!currentStack) {
    label.style.display = 'none';
    newBtn.classList.remove('visible');
    return;
  }

  label.style.display = 'block';
  newBtn.classList.add('visible');
  document.getElementById('notesLabel').textContent = db.stacks[currentStack]?.name || 'notes';

  notesInStack(currentStack).forEach(([id, n]) => {
    const div = document.createElement('div');
    div.className = 'folder' + (currentNote === id ? ' active' : '');
    div.innerHTML = `<div class="folder-title">${n.title || 'untitled'}</div><div class="folder-date">${fmt(n.ts)}</div>`;
    div.onclick = () => { currentNote = id; renderNotes(); renderEditor(); };
    list.appendChild(div);
  });
}

function renderEditor() {
  const topbar     = document.getElementById('topbar');
  const textarea   = document.getElementById('content');
  const emptyState = document.getElementById('emptyState');

  if (!currentNote || !db.notes[currentNote]) {
    topbar.style.display     = 'none';
    textarea.style.display   = 'none';
    emptyState.style.display = 'flex';
    emptyState.textContent   = currentStack ? 'select a note or create one' : 'select a stack to begin';
    return;
  }

  topbar.style.display     = 'flex';
  textarea.style.display   = 'block';
  emptyState.style.display = 'none';

  const n = db.notes[currentNote];
  document.getElementById('titleInput').value = n.title || '';
  document.getElementById('content').value    = n.content || '';

  const s = document.querySelector('.save');
  s.textContent = 'Save';
  s.className   = 'save';
}

// ── Actions ──────────────────────────────────────────────────────────────────
function createStack() {
  openModal({
    title: 'New Stack',
    body: '<input id="modalInput" placeholder="Stack name" maxlength="40">',
    confirmLabel: 'Create',
    confirmClass: 'confirm',
    onConfirm: () => {
      const name = document.getElementById('modalInput')?.value.trim();
      if (!name) return;
      const id = uid();
      db.stacks[id] = { name };
      currentStack = id;
      currentNote  = null;
      saveDB();
      render();
    }
  });
}

function deleteStack(id) {
  const stackName = db.stacks[id]?.name || 'this stack';
  openModal({
    title: 'Delete Stack',
    body: `<p>Delete <strong>${stackName}</strong> and all its notes? This can't be undone.</p>`,
    confirmLabel: 'Delete',
    confirmClass: 'danger',
    onConfirm: () => {
      delete db.stacks[id];
      Object.keys(db.notes).forEach(nid => {
        if (db.notes[nid].stackId === id) delete db.notes[nid];
      });
      if (currentStack === id) { currentStack = null; currentNote = null; }
      saveDB();
      render();
    }
  });
}

function createNote() {
  if (!currentStack) return;
  const id = uid();
  db.notes[id] = { title: '', content: '', stackId: currentStack, ts: Date.now() };
  currentNote = id;
  saveDB();
  render();
  document.getElementById('titleInput').focus();
}

function saveNote() {
  if (!currentNote) return;
  db.notes[currentNote].title   = document.getElementById('titleInput').value.trim() || 'untitled';
  db.notes[currentNote].content = document.getElementById('content').value;
  db.notes[currentNote].ts      = Date.now();
  saveDB();
  renderNotes();

  const s = document.querySelector('.save');
  s.textContent = 'Saved ✓';
  s.className   = 'save saved';
  setTimeout(() => { s.textContent = 'Save'; s.className = 'save'; }, 1500);
}

function deleteNote() {
  if (!currentNote) return;
  const title = db.notes[currentNote]?.title || 'this note';
  openModal({
    title: 'Delete Note',
    body: `<p>Delete <strong>${title}</strong>? This can't be undone.</p>`,
    confirmLabel: 'Delete',
    confirmClass: 'danger',
    onConfirm: () => {
      delete db.notes[currentNote];
      currentNote = null;
      saveDB();
      render();
    }
  });
}

// ── Keyboard shortcut: Cmd/Ctrl+S ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    if (currentNote) saveNote();
  }
  if (e.key === 'Escape') closeModal();
});

// ── Boot ─────────────────────────────────────────────────────────────────────
render();

// ── TODO: replace localStorage with your backend ─────────────────────────────
// loadDB()    → GET    /api/data
// saveDB()    → POST   /api/data
// createStack → POST   /api/stacks
// deleteStack → DELETE /api/stacks/:id
// createNote  → POST   /api/notes
// saveNote    → PUT    /api/notes/:id
// deleteNote  → DELETE /api/notes/:id
