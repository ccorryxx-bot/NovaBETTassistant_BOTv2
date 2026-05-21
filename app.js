/* Diamond-BETT Helper | Professional AI Assistant v4 (Security & UX Update) */

const firebaseConfig = {
  apiKey: "AIzaSyC67B7s8iUUPaR_2JHFpXraSovtD6z77io",
  authDomain: "my-project-groq.firebaseapp.com",
  projectId: "my-project-groq",
  storageBucket: "my-project-groq.firebasestorage.app",
  messagingSenderId: "370359365720",
  appId: "1:370359365720:web:18567f9f241f7f4d499a2d"
};

const ADMIN_PASSWORD = 'admin_kyawg2006';
let db;
let isAdminUnlocked = false;
let systemConfig = {
    workerUrl: 'https://nameless-mud-c256.zekyyyy2006.workers.dev/',
    modelName: 'GPT-4.1',
    floatingQuestions: "မင်းဒီနေ့ ဘယ်လိုလဲ?🧐",
    enableFloating: true
};

let lastQuickActionTime = 0;
const COOLDOWN_TIME = 15000; // 15s

// Sound Notifications
const sendSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
const receiveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
db = firebase.firestore();

async function loadSystemConfig() {
    try {
        const doc = await db.collection('settings').doc('config').get();
        if (doc.exists) {
            systemConfig = { ...systemConfig, ...doc.data() };
            updateAdminUI();
        }
    } catch (e) {
        console.error("Config load error:", e);
    }
}

function updateAdminUI() {
    if (document.getElementById('workerUrlInput')) document.getElementById('workerUrlInput').value = systemConfig.workerUrl;
    if (document.getElementById('modelNameInput')) document.getElementById('modelNameInput').value = systemConfig.modelName;
    if (document.getElementById('floatingQuestionsInput')) document.getElementById('floatingQuestionsInput').value = systemConfig.floatingQuestions;
    if (document.getElementById('enableFloatingToggle')) document.getElementById('enableFloatingToggle').checked = systemConfig.enableFloating;
}

window.addEventListener('load', () => {
    loadSystemConfig();
    db.collection('settings').doc('knowledge').onSnapshot(snap => {
        if (snap.exists) {
            const el = document.getElementById('knowledgeBase');
            if (el) el.value = snap.data().content || '';
        }
    });
    addMessage('bot', 'မင်္ဂလာပါ! **Diamond-BETT Helper** မှ ကြိုဆိုပါသည်။ ကျွန်ုပ်တို့ ဘာများ ကူညီပေးရမလဲ?', true);
    startFloatingNotiLoop();
});

// ============ ADMIN PANEL FUNCTIONS ============
window.openAdmin = () => {
    document.getElementById('adminPanel').classList.add('open');
    document.getElementById('overlay').classList.add('show');
    if (!isAdminUnlocked) {
        document.getElementById('admin-gate').style.display = 'flex';
        document.getElementById('admin-main-content').style.display = 'none';
    } else {
        document.getElementById('admin-gate').style.display = 'none';
        document.getElementById('admin-main-content').style.display = 'flex';
    }
};

window.tryUnlockAdmin = () => {
    const pw = document.getElementById('adminPasswordInput').value;
    if (pw === ADMIN_PASSWORD) {
        isAdminUnlocked = true;
        document.getElementById('admin-gate').style.display = 'none';
        document.getElementById('admin-main-content').style.display = 'flex';
    } else {
        alert('Password မမှန်ပါ။');
    }
};

window.closeAdmin = () => {
    document.getElementById('adminPanel').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tabName}-btn`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    if (tabName === 'logs') loadLogs();
};

window.saveSystemConfig = async () => {
    const workerUrl = document.getElementById('workerUrlInput').value.trim();
    const modelName = document.getElementById('modelNameInput').value.trim();
    const floatingQuestions = document.getElementById('floatingQuestionsInput').value.trim();
    const enableFloating = document.getElementById('enableFloatingToggle').checked;
    
    const btn = document.getElementById('saveConfigBtn');
    btn.disabled = true;
    btn.innerText = 'Saving...';
    try {
        const updateData = { workerUrl, modelName, floatingQuestions, enableFloating, updatedAt: new Date().toISOString() };
        await db.collection('settings').doc('config').set(updateData, { merge: true });
        systemConfig = { ...systemConfig, ...updateData };
        alert('Config saved successfully!');
    } catch (e) {
        alert('Error saving config: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Config';
    }
};

window.saveToCloud = async () => {
    const data = document.getElementById('knowledgeBase').value;
    const btn = document.getElementById('saveBtn');
    try {
        btn.disabled = true;
        await db.collection('settings').doc('knowledge').set({ content: data, updatedAt: new Date().toISOString() });
        alert('Knowledge Base updated!');
    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        btn.disabled = false;
    }
};

// ============ FLOATING NOTI ============
function startFloatingNotiLoop() {
    setInterval(() => {
        if (systemConfig.enableFloating && systemConfig.floatingQuestions) {
            const questions = systemConfig.floatingQuestions.split('\n').filter(q => q.trim());
            if (questions.length > 0) {
                const randomQ = questions[Math.floor(Math.random() * questions.length)];
                showFloatingBubble(randomQ);
            }
        }
    }, 180000); // 3 minutes
}

function showFloatingBubble(text) {
    const bubble = document.getElementById('floatingBubble');
    bubble.innerText = text;
    bubble.classList.add('show');
    setTimeout(() => bubble.classList.remove('show'), 6000);
}

// ============ CHAT FUNCTIONS ============
function addMessage(sender, text, isInitial = false) {
    const chatbox = document.getElementById('chatbox');
    const wrap = document.createElement('div');
    wrap.className = sender === 'bot' ? 'bot-wrap' : 'user-wrap';
    
    if (sender === 'bot') {
        wrap.innerHTML = `
            <div class="bot-card">${marked.parse(text)}</div>
            <div class="bot-meta">
                <span>${new Date().toLocaleTimeString()}</span>
                <span class="bot-model-tag"><i class="fas fa-microchip"></i> ${systemConfig.modelName}</span>
            </div>
        `;
        if (!isInitial) receiveSound.play().catch(e => console.log("Audio play blocked"));
    } else {
        wrap.innerHTML = `<div class="user-bubble">${text}</div>`;
        sendSound.play().catch(e => console.log("Audio play blocked"));
    }
    
    chatbox.appendChild(wrap);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function showThinking() {
    const chatbox = document.getElementById('chatbox');
    const div = document.createElement('div');
    div.id = 'thinking-indicator';
    div.className = 'thinking';
    div.innerHTML = `Thinking <span>.</span><span>.</span><span>.</span> 🤔`;
    chatbox.appendChild(div);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function removeThinking() {
    const el = document.getElementById('thinking-indicator');
    if (el) el.remove();
}

window.handleSend = async () => {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;
    
    addMessage('user', text);
    input.value = '';
    showThinking();
    
    try {
        const kbDoc = await db.collection('settings').doc('knowledge').get();
        const kbContent = kbDoc.exists ? kbDoc.data().content : "";

        const response = await fetch(systemConfig.workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, knowledge: kbContent, model: systemConfig.modelName })
        });
        
        const data = await response.json();
        removeThinking();
        addMessage('bot', data.reply || data.response || "တောင်းပန်ပါတယ်၊ အခုလောလောဆယ် မဖြေကြားနိုင်သေးပါ။");
        
        db.collection('logs').add({ user: text, bot: data.reply || data.response, timestamp: new Date().toISOString() });
    } catch (e) {
        removeThinking();
        addMessage('bot', "Error: AI နဲ့ ချိတ်ဆက်လို့ မရပါ။ Worker URL ကို ပြန်စစ်ပေးပါ။");
    }
};

window.quickSend = (text) => {
    const now = Date.now();
    if (now - lastQuickActionTime < COOLDOWN_TIME) {
        const remaining = Math.ceil((COOLDOWN_TIME - (now - lastQuickActionTime)) / 1000);
        alert(`ခေတ္တစောင့်ပါ... ${remaining} စက္ကန့်အကြာမှ ထပ်မံနှိပ်နိုင်ပါမည်။`);
        return;
    }
    lastQuickActionTime = now;
    document.getElementById('userInput').value = text;
    handleSend();
};

async function loadLogs() {
    const box = document.getElementById('logBox');
    box.innerHTML = 'Loading logs...';
    try {
        const snap = await db.collection('logs').orderBy('timestamp', 'desc').limit(20).get();
        box.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            const card = document.createElement('div');
            card.className = 'log-card';
            card.innerHTML = `
                <div class="log-q">U: ${d.user}</div>
                <div class="log-a">B: ${d.bot.substring(0, 50)}...</div>
                <div class="log-t">${new Date(d.timestamp).toLocaleString()}</div>
            `;
            box.appendChild(card);
        });
    } catch (e) {
        box.innerHTML = 'Error loading logs.';
    }
}

window.scrollDown = () => {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: 'smooth' });
};

window.secretClick = (e) => {
    if (e.detail === 3) openAdmin();
};
