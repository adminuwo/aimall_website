/**
 * AI-MALL™ — Universal Gateway System
 * Handles Admin Login (Custom Modal) and Voice Recognition
 */

(function() {
    // 1. CREATE ADMIN MODAL HTML
    function initGateway() {
        const modalHTML = `
        <div id="admin-auth-modal" class="admin-modal-overlay" style="display:none;">
            <div class="admin-modal-card">
                <div class="admin-modal-close" onclick="closeAdminModal()">×</div>
                <div class="admin-modal-logo">AI-MALL™</div>
                <div class="admin-modal-title">Administrative Gateway</div>
                <div class="admin-modal-sub">Neural Intel System Entrance</div>
                
                <div class="admin-modal-form">
                    <input type="email" id="admin-gate-email" placeholder="Admin Identity (Email)" class="admin-modal-input">
                    <input type="password" id="admin-gate-pass" placeholder="Encryption Key (Password)" class="admin-modal-input">
                    <button onclick="processAdminLogin()" class="admin-modal-btn">Authorize Session</button>
                    <div id="admin-gate-error" class="admin-modal-error"></div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGateway);
    } else {
        initGateway();
    }

    // 2. ADMIN FUNCTIONS
    window.openAdmin = function() {
        document.getElementById('admin-auth-modal').style.display = 'flex';
        document.getElementById('admin-gate-email').focus();
    };

    window.closeAdminModal = function() {
        document.getElementById('admin-auth-modal').style.display = 'none';
    };

    window.processAdminLogin = async function() {
        const email = document.getElementById('admin-gate-email').value.trim();
        const pass = document.getElementById('admin-gate-pass').value.trim();
        const error = document.getElementById('admin-gate-error');

        if (!email || !pass) {
            error.textContent = "❌ Please enter identification credentials.";
            error.style.display = 'block';
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || '';
            const res = await fetch(`${apiBase}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: pass })
            });
            const data = await res.json();
            if (data.success && data.token) {
                sessionStorage.setItem('admin_auth', 'true');
                sessionStorage.setItem('admin_token', data.token);
                localStorage.setItem('rag_token', data.token);
                window.location.href = "admin.html";
            } else {
                error.textContent = "❌ " + (data.error || "Access Denied. Verify identification.");
                error.style.display = 'block';
            }
        } catch (err) {
            error.textContent = "❌ Server communication error.";
            error.style.display = 'block';
        }
    };

    // 3. VOICE RECOGNITION FUNCTIONS
    let recognition;
    let isListening = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            const micBtn = document.querySelector('.chat-action-btn.mic');
            const input = document.getElementById('chat-main-input');
            if (micBtn) micBtn.classList.add('mic-listening');
            if (input) {
                input.placeholder = "Recording... Speak Now";
                input.classList.add('recording-active');
            }
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('chat-main-input');
            if (input) {
                input.value = transcript;
                // Auto send if sendMessage exists
                if (typeof window.sendMessage === 'function') {
                    setTimeout(() => window.sendMessage(), 500);
                }
            }
        };

        recognition.onend = function() {
            const micBtn = document.querySelector('.chat-action-btn.mic');
            const input = document.getElementById('chat-main-input');
            if (micBtn) micBtn.classList.remove('mic-listening');
            if (input) {
                input.placeholder = "Type message...";
                input.classList.remove('recording-active');
            }
            isListening = false;
        };

        recognition.onerror = function() {
            isListening = false;
        };
    }

    window.toggleVoiceRec = function() {
        if (!recognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        if (isListening) {
            recognition.stop();
            isListening = false;
        } else {
            recognition.start();
            isListening = true;
        }
    };

    // 4. CHAT TOGGLE (Global fallback)
    window.toggleChat = function() {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.classList.toggle('active');
        console.log("🔄 Toggling Chat Window");
    };

})();
