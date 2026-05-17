/* NovaBETT – Game | app.js - FIXED VERSION */

const BASE_TITLE = 'NovaBETT – Game | Premium AI Support';
const KB_PASSWORD = 'admin123'; // Change this to your desired password
let db;
let kbUnlocked = false;
let kbAttempts = 0;
const MAX_ATTEMPTS = 5;

const firebaseConfig = {
  apiKey: "AIzaSyC67B7s8iUUPaR_2JHFpXraSovtD6z77io",
  authDomain: "my-project-groq.firebaseapp.com",
  projectId: "my-project-groq",
  storageBucket: "my-project-groq.firebasestorage.app",
  messagingSenderId: "370359365720",
  appId: "1:370359365720:web:18567f9f241f7f4d499a2d"
};

window.addEventListener('load', () => {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  db.collection('settings').doc('knowledge').onSnapshot(snap => {
    if (snap.exists) {
      const el = document.getElementById('knowledgeBase');
      if (el) el.value = snap.data().content || '';
    }
  });
  document.title = BASE_TITLE;
  addMessage('bot','မင်္ဂလာပါ! NovaBETT Game AI Support မှ ကြိုဆိုပါသည်။\nကျွန်ုပ်တို့ ဘာများ ကူညီပေးရမလဲ?',true);
});

// ============ ADMIN PANEL FUNCTIONS ============
window.openAdmin = () => {
  const panel = document.getElementById('adminPanel');
  const overlay = document.getElementById('overlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('show');
};

window.closeAdmin = () => {
  const panel = document.getElementById('adminPanel');
  const overlay = document.getElementById('overlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
};

window.switchTab = (tabName) => {
  // Hide all tabs
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  // Show selected tab
  const tabPanel = document.getElementById(`tab-${tabName}`);
  const tabBtn = document.getElementById(`tab-${tabName}-btn`);
  if (tabPanel) tabPanel.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');
  
  // Load logs if switching to logs tab
  if (tabName === 'logs') {
    loadChatLogs();
  }
};

// ============ KNOWLEDGE BASE FUNCTIONS ============
window.togglePwVisibility = () => {
  const input = document.getElementById('kbPassword');
  const icon = document.getElementById('pwToggleIco');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<use href="#ico-eye-off"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<use href="#ico-eye"/>';
  }
};

window.tryUnlockKB = () => {
  const password = document.getElementById('kbPassword').value;
  const errorEl = document.getElementById('kbError');
  const attemptsEl = document.getElementById('kbAttempts');
  
  if (password === KB_PASSWORD) {
    kbUnlocked = true;
    document.getElementById('kb-gate').style.display = 'none';
    document.getElementById('kb-content').classList.add('unlocked');
    kbAttempts = 0;
  } else {
    kbAttempts++;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 2000);
    
    if (kbAttempts >= MAX_ATTEMPTS) {
      document.getElementById('kbUnlockBtn').disabled = true;
      document.getElementById('kbPassword').disabled = true;
      attemptsEl.textContent = `Locked for security. Please refresh to try again.`;
    } else {
      attemptsEl.textContent = `Attempts remaining: ${MAX_ATTEMPTS - kbAttempts}`;
    }
  }
};

window.lockKBAgain = () => {
  kbUnlocked = false;
  kbAttempts = 0;
  document.getElementById('kb-gate').style.display = 'flex';
  document.getElementById('kb-content').classList.remove('unlocked');
  document.getElementById('kbPassword').value = '';
  document.getElementById('kbPassword').type = 'password';
  document.getElementById('pwToggleIco').innerHTML = '<use href="#ico-eye"/>';
  document.getElementById('kbUnlockBtn').disabled = false;
  document.getElementById('kbPassword').disabled = false;
  document.getElementById('kbAttempts').textContent = '';
};

window.saveToCloud = async () => {
  const data = document.getElementById('knowledgeBase').value;
  const btn  = document.getElementById('saveBtn');
  if (!data.trim()) { alert('အချက်အလက် အရင်ဖြည့်ပါ။'); return; }
  if (!db)          { alert('Firebase မတင်ရသေးပါ'); return; }
  btn.disabled = true; btn.classList.remove('saved'); btn.innerHTML = 'Syncing…';
  try {
    await db.collection('settings').doc('knowledge').set({ content: data, updatedAt: new Date().toISOString() });
    btn.innerHTML = `<svg><use href="#ico-shield"/></svg> Saved`; btn.classList.add('saved');
    setTimeout(() => { btn.innerHTML = `<svg><use href="#ico-upload"/></svg> Push to Cloud`; btn.classList.remove('saved'); btn.disabled = false; }, 2800);
  } catch(e) { alert('Error: ' + e.message); btn.disabled = false; }
};

// ============ CHAT LOGGING FUNCTIONS ============
window.logChat = async (user, bot) => {
  try { if (db) await db.collection('chatLogs').add({ user, bot, timestamp: new Date().toISOString() }); } catch(_) {}
};

window.loadChatLogs = async () => {
  const box = document.getElementById('logBox');
  box.innerHTML = '<div class="log-empty">Loading…</div>';
  if (!db) { box.innerHTML = '<div class="log-empty">Firebase မတင်ရသေးပါ</div>'; return; }
  try {
    const snap = await db.collection('chatLogs').orderBy('timestamp','desc').limit(50).get();
    if (snap.empty) { 
      box.innerHTML = '<div class="log-empty">No chat logs yet</div>'; 
      return; 
    }
    box.innerHTML = '';
    snap.forEach(doc => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'log-card';
      card.innerHTML = `
        <div>
          <div class="log-q"><strong>User:</strong> ${escapeHtml(data.user)}</div>
          <div class="log-a"><strong>Bot:</strong> ${escapeHtml(data.bot)}</div>
          <div class="log-t">${new Date(data.timestamp).toLocaleString()}</div>
        </div>
      `;
      box.appendChild(card);
    });
  } catch(e) { 
    box.innerHTML = `<div class="log-empty">Error loading logs: ${e.message}</div>`; 
  }
};

// ============ CHAT MESSAGE FUNCTIONS ============
window.addMessage = (sender, text, isInitial = false) => {
  const chatbox = document.getElementById('chatbox');
  
  if (sender === 'bot') {
    const wrap = document.createElement('div');
    wrap.className = 'bot-wrap';
    wrap.innerHTML = `
      <div class="bot-sender">
        <div class="bot-av"><svg><use href="#ico-bot"/></svg></div>
        <span class="bot-sender-name">NovaBETT AI</span>
      </div>
      <div class="bot-card">${formatMessage(text)}</div>
      <div class="bot-footer">
        <span class="bot-ts">${new Date().toLocaleTimeString()}</span>
        <span class="bot-model">GPT-4.1</span>
        <div class="rate-row">
          <button class="rate-btn" onclick="rateMessage(this, 'up')"><svg><use href="#ico-up"/></svg></button>
          <button class="rate-btn" onclick="rateMessage(this, 'down')"><svg><use href="#ico-down"/></svg></button>
        </div>
      </div>
    `;
    chatbox.appendChild(wrap);
  } else if (sender === 'user') {
    const wrap = document.createElement('div');
    wrap.className = 'user-wrap';
    wrap.innerHTML = `
      <div class="user-bubble">${formatMessage(text)}</div>
      <div class="user-meta">
        <span class="user-ts">${new Date().toLocaleTimeString()}</span>
        <span class="user-tick sent">✓✓</span>
      </div>
    `;
    chatbox.appendChild(wrap);
  }
  
  chatbox.scrollTop = chatbox.scrollHeight;
};

window.handleSend = async () => {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  
  addMessage('user', text);
  input.value = '';
  
  // Log the chat
  await logChat(text, 'Response pending...');
  
  // Simulate bot response (replace with actual API call)
  setTimeout(() => {
    const responses = [
      'ကျွန်တော် နားလည်ပါတယ်။ ကျွန်တော် ကူညီပေးပါ့မယ်။',
      'ဒီအကြောင်းအရာ ကောင်းကောင်း ရှင်းပြပေးပါ့မယ်။',
      'အခြား မေးစရာ ရှိပါသလား?'
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    addMessage('bot', response);
  }, 800);
};

window.quickSend = (text) => {
  const input = document.getElementById('userInput');
  input.value = text;
  handleSend();
};

window.secretClick = (event) => {
  event.preventDefault();
  openAdmin();
};

window.scrollDown = () => {
  const chatbox = document.getElementById('chatbox');
  chatbox.scrollTop = chatbox.scrollHeight;
};

window.rateMessage = (btn, type) => {
  btn.classList.toggle(type === 'up' ? 'up-active' : 'dn-active');
};

// ============ UTILITY FUNCTIONS ============
function formatMessage(text) {
  return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

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
