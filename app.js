/* Diamond-BETT Helper | Professional AI Assistant */

const firebaseConfig = {
  apiKey: "AIzaSyC67B7s8iUUPaR_2JHFpXraSovtD6z77io",
  authDomain: "my-project-groq.firebaseapp.com",
  projectId: "my-project-groq",
  storageBucket: "my-project-groq.firebasestorage.app",
  messagingSenderId: "370359365720",
  appId: "1:370359365720:web:18567f9f241f7f4d499a2d"
};

const KB_PASSWORD = 'admin123';
let db;
let systemConfig = {
    workerUrl: 'https://nameless-mud-c256.zekyyyy2006.workers.dev/',
    modelName: 'GPT-4.1'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
db = firebase.firestore();

// Load Config from Firebase
async function loadSystemConfig() {
    try {
        const doc = await db.collection('settings').doc('config').get();
        if (doc.exists) {
            systemConfig = { ...systemConfig, ...doc.data() };
            document.getElementById('workerUrlInput').value = systemConfig.workerUrl;
            document.getElementById('modelNameInput').value = systemConfig.modelName;
        }
    } catch (e) {
        console.error("Config load error:", e);
    }
}

window.addEventListener('load', () => {
    loadSystemConfig();
    
    // Load Knowledge Base
    db.collection('settings').doc('knowledge').onSnapshot(snap => {
        if (snap.exists) {
            const el = document.getElementById('knowledgeBase');
            if (el) el.value = snap.data().content || '';
        }
    });

    addMessage('bot', 'မင်္ဂလာပါ! **Diamond-BETT Helper** မှ ကြိုဆိုပါသည်။ ကျွန်ုပ်တို့ ဘာများ ကူညီပေးရမလဲ?', true);
});

// ============ ADMIN PANEL FUNCTIONS ============
window.openAdmin = () => {
    document.getElementById('adminPanel').classList.add('open');
    document.getElementById('overlay').classList.add('show');
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

// ============ CONFIG FUNCTIONS ============
window.saveSystemConfig = async () => {
    const workerUrl = document.getElementById('workerUrlInput').value.trim();
    const modelName = document.getElementById('modelNameInput').value.trim();
    const btn = document.getElementById('saveConfigBtn');
    
    if (!workerUrl) return alert('Worker URL ထည့်ပါ။');
    
    btn.disabled = true;
    btn.innerText = 'Saving...';
    
    try {
        await db.collection('settings').doc('config').set({
            workerUrl,
            modelName,
            updatedAt: new Date().toISOString()
        });
        systemConfig = { workerUrl, modelName };
        alert('Config saved successfully!');
    } catch (e) {
        alert('Error saving config: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Config';
    }
};

// ============ KNOWLEDGE BASE FUNCTIONS ============
window.tryUnlockKB = () => {
    const pw = document.getElementById('kbPassword').value;
    if (pw === KB_PASSWORD) {
        document.getElementById('kb-gate').style.display = 'none';
        document.getElementById('kb-content').classList.add('unlocked');
    } else {
        alert('Password မမှန်ပါ။');
    }
};

window.lockKBAgain = () => {
    document.getElementById('kb-gate').style.display = 'flex';
    document.getElementById('kb-content').classList.remove('unlocked');
    document.getElementById('kbPassword').value = '';
};

window.saveToCloud = async () => {
    const data = document.getElementById('knowledgeBase').value;
    const btn = document.getElementById('saveBtn');
    try {
        btn.disabled = true;
        await db.collection('settings').doc('knowledge').set({
            content: data,
            updatedAt: new Date().toISOString()
        });
        alert('Knowledge Base updated!');
    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        btn.disabled = false;
    }
};

// ============ CHAT FUNCTIONS ============
function addMessage(sender, text, isInitial = false) {
    const chatbox = document.getElementById('chatbox');
    const wrap = document.createElement('div');
    wrap.className = sender === 'bot' ? 'bot-wrap' : 'user-wrap';
    
    if (sender === 'bot') {
        wrap.innerHTML = `
            <div class="bot-card">${marked.parse(text)}</div>
            <div style="display:flex; justify-content: space-between; padding: 4px 8px; font-size: 9px; color: rgba(228,172,40,0.4);">
                <span>${new Date().toLocaleTimeString()}</span>
                <span>${systemConfig.modelName}</span>
            </div>
        `;
    } else {
        wrap.innerHTML = `<div class="user-bubble">${text}</div>`;
        wrap.style.alignSelf = 'flex-end';
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
            body: JSON.stringify({
                message: text,
                knowledge: kbContent,
                model: systemConfig.modelName
            })
        });
        
        const data = await response.json();
        removeThinking();
        addMessage('bot', data.reply || data.response || "တောင်းပန်ပါတယ်၊ အခုလောလောဆယ် မဖြေကြားနိုင်သေးပါ။");
        
        // Log to Firebase
        db.collection('logs').add({
            user: text,
            bot: data.reply || data.response,
            timestamp: new Date().toISOString()
        });
        
    } catch (e) {
        removeThinking();
        addMessage('bot', "Error: AI နဲ့ ချိတ်ဆက်လို့ မရပါ။ Worker URL ကို ပြန်စစ်ပေးပါ။");
    }
};

window.quickSend = (text) => {
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
