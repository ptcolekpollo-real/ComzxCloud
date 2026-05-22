// Data Storage
let currentUser = null;
let allItems = [];
let users = [];

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadUsersFromStorage();
    checkAuth();
    addTabEventListeners();
    hideLoadingScreen();
});

// Hide Loading Screen
function hideLoadingScreen() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.animation = 'fadeOut 0.5s ease-in-out forwards';
    }, 2000);
}

// Authentication
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        loadUserData();
    } else {
        showAuth();
    }
}

function showAuth() {
    setTimeout(() => {
        document.getElementById('authContainer').classList.remove('hidden');
    }, 2500);
}

function showApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    updateUserDisplay();
}

function toggleForm() {
    document.getElementById('loginForm').classList.toggle('active');
    document.getElementById('registerForm').classList.toggle('active');
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        showApp();
        loadUserData();
    } else {
        alert('Email atau password salah');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Password tidak cocok');
        return;
    }

    if (users.find(u => u.email === email)) {
        alert('Email sudah terdaftar');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        items: []
    };

    users.push(newUser);
    saveUsersToStorage();

    alert('Daftar berhasil! Silakan login');
    toggleForm();

    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function handleGoogleLogin() {
    const name = prompt('Masukkan nama Anda:');
    if (name) {
        const email = prompt('Masukkan email Google Anda:');
        if (email) {
            let user = users.find(u => u.email === email);
            if (!user) {
                user = {
                    id: Date.now(),
                    name,
                    email,
                    password: 'google',
                    items: []
                };
                users.push(user);
                saveUsersToStorage();
            }
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            showApp();
            loadUserData();
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    allItems = [];
    toggleUserMenu();
    document.getElementById('appContainer').classList.add('hidden');
    showAuth();
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('userNameDisplay').textContent = currentUser.name || 'User';
        document.getElementById('userEmailDisplay').textContent = currentUser.email;
    }
}

// Storage
function saveUsersToStorage() {
    localStorage.setItem('users', JSON.stringify(users));
}

function loadUsersFromStorage() {
    const saved = localStorage.getItem('users');
    users = saved ? JSON.parse(saved) : [];
}

function saveUserData() {
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].items = allItems;
        saveUsersToStorage();
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function loadUserData() {
    const user = users.find(u => u.id === currentUser.id);
    if (user) {
        allItems = user.items || [];
    } else {
        allItems = [];
    }
    renderContent();
}

// Tab Navigation
function addTabEventListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    const contentTabs = document.querySelectorAll('.content-tab');
    contentTabs.forEach(t => t.classList.remove('active'));

    document.getElementById(tab + 'Content').classList.add('active');
    renderContent();
}

// Upload Handling
function toggleUploadMenu() {
    const menu = document.getElementById('uploadMenu');
    menu.classList.toggle('hidden');
}

function uploadLinkPrompt() {
    const url = prompt('Masukkan URL link:');
    if (url) {
        const item = {
            id: Date.now(),
            type: 'link',
            name: url.substring(0, 50) + (url.length > 50 ? '...' : ''),
            url,
            date: new Date().toLocaleDateString()
        };
        allItems.push(item);
        saveUserData();
        renderContent();
        toggleUploadMenu();
        alert('Link berhasil ditambahkan');
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (isVideo || isImage) {
                const item = {
                    id: Date.now() + Math.random(),
                    type: isVideo ? 'video' : 'photo',
                    name: file.name,
                    data: e.target.result,
                    date: new Date().toLocaleDateString()
                };
                allItems.push(item);
            }
        };
        reader.readAsDataURL(file);
    }

    setTimeout(() => {
        saveUserData();
        renderContent();
        toggleUploadMenu();
    }, 500);

    event.target.value = '';
}

function createNotePrompt() {
    const title = prompt('Judul catatan:');
    if (title) {
        const content = prompt('Isi catatan:');
        if (content !== null) {
            const note = {
                id: Date.now(),
                type: 'note',
                title,
                content,
                date: new Date().toLocaleDateString()
            };
            allItems.push(note);
            saveUserData();
            renderContent();
            toggleUploadMenu();
        }
    }
}

// Render Content
function renderContent() {
    renderAllItems();
    renderPhotos();
    renderVideos();
    renderNotes();
}

function renderAllItems() {
    const container = document.getElementById('allItemsList');
    if (allItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Mulai dengan mengunggah file atau membuat catatan</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allItems.map(item => createItemCard(item)).join('');
    addCardEventListeners();
}

function renderPhotos() {
    const container = document.getElementById('photosGrid');
    const photos = allItems.filter(item => item.type === 'photo');

    if (photos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-image"></i>
                <p>Tidak ada foto</p>
            </div>
        `;
        return;
    }

    container.innerHTML = photos.map(item => createItemCard(item)).join('');
    addCardEventListeners();
}

function renderVideos() {
    const container = document.getElementById('videosGrid');
    const videos = allItems.filter(item => item.type === 'video');

    if (videos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <p>Tidak ada video</p>
            </div>
        `;
        return;
    }

    container.innerHTML = videos.map(item => createItemCard(item)).join('');
    addCardEventListeners();
}

function renderNotes() {
    const container = document.getElementById('notesList');
    const notes = allItems.filter(item => item.type === 'note');

    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <p>Tidak ada catatan</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-card" onclick="viewNote(${note.id})">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-preview">${escapeHtml(note.content.substring(0, 100))}</div>
            <div class="note-date">${note.date}</div>
        </div>
    `).join('');
}

function createItemCard(item) {
    if (item.type === 'link') {
        return `
            <div class="item-card" onclick="viewLink('${item.url}')">
                <div class="item-preview">
                    <i class="fas fa-link"></i>
                </div>
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-date">${item.date}</div>
                </div>
                <div class="item-actions" onclick="event.stopPropagation()">
                    <button class="btn-delete" onclick="deleteItem(${item.id})">Hapus</button>
                </div>
            </div>
        `;
    }

    const icon = item.type === 'photo' ? 'fas fa-image' : 'fas fa-video';
    const previewContent = item.data ? 
        (item.type === 'photo' ? 
            `<img src="${item.data}" alt="${item.name}" />` : 
            `<video src="${item.data}"></video>`) : 
        `<i class="${icon}"></i>`;

    return `
        <div class="item-card" onclick="viewItem(${item.id})">
            <div class="item-preview">
                ${previewContent}
            </div>
            <div class="item-info">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-date">${item.date}</div>
            </div>
            <div class="item-actions" onclick="event.stopPropagation()">
                <button class="btn-delete" onclick="deleteItem(${item.id})">Hapus</button>
            </div>
        </div>
    `;
}

function addCardEventListeners() {
    const cards = document.querySelectorAll('.item-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = '';
            }, 10);
        });
    });
}

// View/Delete Items
function viewItem(id) {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    let content = '';

    if (item.type === 'photo') {
        content = `
            <img src="${item.data}" alt="${item.name}" />
            <h2>${escapeHtml(item.name)}</h2>
            <p>Ditambahkan: ${item.date}</p>
        `;
    } else if (item.type === 'video') {
        content = `
            <video controls style="width: 100%; height: auto; max-height: 500px; border-radius: 12px; margin-bottom: 20px;">
                <source src="${item.data}" type="video/mp4">
                Browser Anda tidak mendukung video.
            </video>
            <h2>${escapeHtml(item.name)}</h2>
            <p>Ditambahkan: ${item.date}</p>
        `;
    }

    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('detailModal').classList.remove('hidden');
}

function viewNote(id) {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    const content = `
        <h2>${escapeHtml(item.title)}</h2>
        <p style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(item.content)}</p>
        <p style="margin-top: 20px; opacity: 0.6;">Dibuat: ${item.date}</p>
    `;

    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('detailModal').classList.remove('hidden');
}

function viewLink(url) {
    const content = `
        <i class="fas fa-link" style="font-size: 48px; color: #ef4444; margin-bottom: 20px;"></i>
        <h2>Link</h2>
        <p>${escapeHtml(url)}</p>
        <a href="${url}" target="_blank" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">Buka Link</a>
    `;

    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('detailModal').classList.remove('hidden');
}

function deleteItem(id) {
    if (confirm('Yakin ingin menghapus item ini?')) {
        allItems = allItems.filter(item => item.id !== id);
        saveUserData();
        renderContent();
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.getElementById('modalBody').innerHTML = '';
}

// Menu Toggle
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');

    const instagramMenu = document.getElementById('instagramMenu');
    if (!instagramMenu.classList.contains('hidden')) {
        instagramMenu.classList.add('hidden');
    }
}

function toggleInstagramMenu() {
    const menu = document.getElementById('instagramMenu');
    menu.classList.toggle('hidden');

    const userMenu = document.getElementById('userMenu');
    if (!userMenu.classList.contains('hidden')) {
        userMenu.classList.add('hidden');
    }
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-user') && !e.target.closest('.user-menu')) {
        document.getElementById('userMenu').classList.add('hidden');
    }
    if (!e.target.closest('.btn-instagram') && !e.target.closest('.instagram-menu')) {
        document.getElementById('instagramMenu').classList.add('hidden');
    }
    if (!e.target.closest('.upload-button') && !e.target.closest('.upload-menu')) {
        document.getElementById('uploadMenu').classList.add('hidden');
    }
});

// Close modal when clicking outside
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detailModal')) {
        closeModal();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        document.getElementById('uploadMenu').classList.add('hidden');
    }
});

// Utility
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}