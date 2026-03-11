document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentMode = 'query'; // query, scan, generate
    let selectedFile = null;
    let token = localStorage.getItem('token');
    let user = JSON.parse(localStorage.getItem('user'));

    // DOM Elements
    const chatContainer = document.getElementById('chat-container');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtns = [document.getElementById('clear-chat')];
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadingText = document.getElementById('loading-text');
    
    const fileUpload = document.getElementById('file-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const fileNameDisplay = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');

    const modeDesc = document.getElementById('current-mode-desc');
    const modeTitle = document.getElementById('current-mode-title');
    const mobileModeSelect = document.getElementById('mobile-mode-select');
    const modeBtns = document.querySelectorAll('.mode-btn');

    // Auth Modal DOM
    const authModal = document.getElementById('auth-modal');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const userDisplay = document.getElementById('user-display');
    const logoutBtns = [document.getElementById('logout-btn'), document.getElementById('mobile-logout-btn')];

    // History DOM
    const chatHistoryList = document.getElementById('chat-history-list');
    const refreshHistoryBtn = document.getElementById('refresh-history-btn');

    const modeConfig = {
        query: {
            title: '<i class="fa-solid fa-gavel text-indigo-500"></i> Legal Query Assistant',
            desc: 'Ask any legal question in plain language.',
            placeholder: 'Ask a legal question...',
            endpoint: '/api/chat/legal-query'
        },
        scan: {
            title: '<i class="fa-solid fa-file-contract text-indigo-500"></i> Contract Risk Scanner',
            desc: 'Upload a contract to identify risky clauses and get safer alternatives.',
            placeholder: 'Add any specific scanning instructions (optional)...',
            endpoint: '/api/chat/scan-contract'
        },
        generate: {
            title: '<i class="fa-solid fa-file-signature text-indigo-500"></i> Legal Document Generator',
            desc: 'Describe the document you need drafted.',
            placeholder: 'Describe the legal document (e.g., Non-disclosure agreement for software dev)...',
            endpoint: '/api/chat/generate-document'
        }
    };

    // --- Authentication Logic ---
    function checkAuth() {
        if (!token) {
            authModal.classList.remove('hidden');
        } else {
            authModal.classList.add('hidden');
            if (user && user.username) {
                userDisplay.textContent = `Hi, ${user.username}`;
            }
            fetchChatHistory();
        }
    }

    // Toggle Login/Register Tabs
    tabLogin.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('border-indigo-600', 'text-indigo-600');
        tabLogin.classList.remove('text-gray-500');
        tabRegister.classList.remove('border-indigo-600', 'text-indigo-600');
        tabRegister.classList.add('text-gray-500', 'border-transparent');
    });

    tabRegister.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        tabRegister.classList.add('border-indigo-600', 'text-indigo-600');
        tabRegister.classList.remove('text-gray-500');
        tabLogin.classList.remove('border-indigo-600', 'text-indigo-600');
        tabLogin.classList.add('text-gray-500', 'border-transparent');
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                token = data.token;
                user = data.user;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                checkAuth();
            } else {
                loginError.textContent = data.msg || 'Login failed';
                loginError.classList.remove('hidden');
            }
        } catch (err) {
            loginError.textContent = 'Server error. Please try again.';
            loginError.classList.remove('hidden');
        }
    });

    // Handle Signup
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.classList.add('hidden');
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                token = data.token;
                user = data.user;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                checkAuth();
            } else {
                registerError.textContent = data.msg || 'Signup failed';
                registerError.classList.remove('hidden');
            }
        } catch (err) {
            registerError.textContent = 'Server error. Please try again.';
            registerError.classList.remove('hidden');
        }
    });

    // Logout
    logoutBtns.forEach(btn => {
        if(!btn) return;
        btn.addEventListener('click', () => {
            token = null;
            user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Clear UI
            const messages = chatContainer.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            welcomeScreen.style.display = 'flex';
            chatHistoryList.innerHTML = '';
            
            checkAuth();
        });
    });


    // --- Core Chat Logic ---

    // History Logic
    async function fetchChatHistory() {
        if (!token) return;
        try {
            const res = await fetch('/api/chat/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const history = await res.json();
                renderChatHistory(history);
            } else if (res.status === 401) {
                // Token invalid
                document.getElementById('logout-btn').click();
            }
        } catch (error) {
            console.error('Failed to parse history:', error);
        }
    }

    refreshHistoryBtn.addEventListener('click', fetchChatHistory);

    function renderChatHistory(chats) {
        chatHistoryList.innerHTML = '';
        if (chats.length === 0) {
            chatHistoryList.innerHTML = '<div class="text-xs text-gray-500 p-2 text-center">No chat history found.</div>';
            return;
        }

        // Reverse to show latest first
        chats.reverse().forEach(chat => {
            const item = document.createElement('div');
            item.className = 'w-full flex items-center gap-2 p-2 rounded text-gray-300 hover:bg-gray-800 transition cursor-pointer text-sm truncate';
            
            let icon = 'fa-comment';
            if(chat.mode === 'query') icon = 'fa-gavel';
            if(chat.mode === 'scan') icon = 'fa-file-contract';
            if(chat.mode === 'generate') icon = 'fa-file-signature';
            
            item.innerHTML = `
                <i class="fa-solid ${icon} text-gray-500 w-4"></i>
                <span class="truncate">${chat.userMessage.substring(0, 30)}...</span>
            `;

            // On click, load this specific piece of history into the view
            item.addEventListener('click', () => {
                welcomeScreen.style.display = 'none';
                const messages = chatContainer.querySelectorAll('.message');
                messages.forEach(msg => msg.remove());
                
                let userHtml = chat.userMessage;
                if(chat.mode === 'scan' && chat.userMessage.includes('Scanned file:')) {
                    userHtml = `<div class="bg-indigo-50 border border-indigo-100 p-2 text-indigo-900 rounded text-sm mb-2 opacity-90"><i class="fa-solid fa-file-contract text-indigo-500"></i> ${chat.userMessage}</div>`;
                }
                
                appendMessage('user', userHtml);
                appendMessage('ai', window.marked ? marked.parse(chat.aiMessage) : chat.aiMessage.replace(/\n/g, '<br>'));
            });

            chatHistoryList.appendChild(item);
        });
    }

    // Input handlers & UI state
    userInput.addEventListener('input', function() {
        this.style.height = '56px';
        this.style.height = (this.scrollHeight) + 'px';
        validateInput();
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if(!sendBtn.disabled) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    function validateInput() {
        const text = userInput.value.trim();
        if (currentMode === 'scan') {
            sendBtn.disabled = !selectedFile;
        } else {
            sendBtn.disabled = text.length === 0;
        }
    }

    updateModeUI('query');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => setMode(e.currentTarget.dataset.mode));
    });

    mobileModeSelect.addEventListener('change', (e) => setMode(e.target.value));

    function setMode(mode) {
        currentMode = mode;
        updateModeUI(mode);
        validateInput();
        
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.replace('text-gray-400', 'text-white');
                btn.classList.add('bg-gray-800');
                const i = btn.querySelector('i');
                if(i) i.classList.add('text-indigo-400');
            } else {
                btn.classList.replace('text-white', 'text-gray-400');
                btn.classList.remove('bg-gray-800');
                const i = btn.querySelector('i');
                if(i) i.classList.remove('text-indigo-400');
            }
        });
        mobileModeSelect.value = mode;
    }

    function updateModeUI(mode) {
        const config = modeConfig[mode];
        if (modeTitle) modeTitle.innerHTML = config.title;
        if (modeDesc) modeDesc.textContent = config.desc;
        userInput.placeholder = config.placeholder;
        
        if (mode === 'scan') {
            uploadBtn.classList.remove('hidden');
            uploadBtn.disabled = false;
        } else {
            uploadBtn.classList.add('hidden');
            uploadBtn.disabled = true;
            clearFile();
        }
    }

    uploadBtn.addEventListener('click', () => { if(currentMode === 'scan') fileUpload.click(); });
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            fileNameDisplay.textContent = file.name;
            filePreviewContainer.classList.remove('hidden');
            validateInput();
        }
    });
    removeFileBtn.addEventListener('click', clearFile);

    function clearFile() {
        selectedFile = null;
        fileUpload.value = '';
        filePreviewContainer.classList.add('hidden');
        validateInput();
    }

    clearChatBtns.forEach(btn => {
        if(!btn) return;
        btn.addEventListener('click', async () => {
            const messages = chatContainer.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            welcomeScreen.style.display = 'flex';
            
            if (token) {
                try {
                    const res = await fetch('/api/chat/history', {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if(res.ok) fetchChatHistory();
                } catch(e) {}
            }
        });
    });

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (sendBtn.disabled || !token) return;

        const text = userInput.value.trim();
        const fileToUpload = selectedFile;
        
        if (currentMode === 'scan' && !fileToUpload) return;
        if (currentMode !== 'scan' && !text) return;

        userInput.value = '';
        userInput.style.height = '56px';
        clearFile();
        validateInput();
        welcomeScreen.style.display = 'none';

        let userMessageHtml = '';
        if (currentMode === 'scan' && fileToUpload) {
            userMessageHtml = `
                <div class="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-2 text-indigo-900 rounded-lg text-sm mb-2 opacity-90">
                    <i class="fa-solid fa-file-contract text-indigo-500"></i> ${fileToUpload.name}
                </div>
                ${text ? `<div>${text}</div>` : 'Please scan this contract for risks.'}
            `;
        } else {
            userMessageHtml = text.replace(/\n/g, '<br>');
        }
        
        appendMessage('user', userMessageHtml);

        loadingIndicator.classList.remove('hidden');
        if (currentMode === 'scan') loadingText.textContent = 'Scanning contract...';
        else if (currentMode === 'generate') loadingText.textContent = 'Drafting document...';
        else loadingText.textContent = 'Analyzing query...';

        try {
            let responseData;
            const endpoint = modeConfig[currentMode].endpoint;

            if (currentMode === 'scan') {
                const formData = new FormData();
                formData.append('contract', fileToUpload);
                if (text) formData.append('instructions', text);
                
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                responseData = await res.json();
                
            } else if (currentMode === 'query') {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ query: text })
                });
                responseData = await res.json();
            } else if (currentMode === 'generate') {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ request: text })
                });
                responseData = await res.json();
            }

            loadingIndicator.classList.add('hidden');

            if (responseData.error) {
                appendMessage('system', `Error: ${responseData.error}`);
                if (responseData.error === 'Token is not valid' || responseData.msg === 'No token, authorization denied') {
                    document.getElementById('logout-btn').click();
                }
                return;
            }

            let aiText = responseData.answer || responseData.analysis || responseData.document || 'No response received.';
            
            let formattedHtml = aiText;
            if (window.marked) {
                formattedHtml = marked.parse(aiText);
            } else {
                formattedHtml = aiText.replace(/\n/g, '<br>');
            }
            
            appendMessage('ai', formattedHtml);
            
            // Re-fetch chat history to update sidebar
            fetchChatHistory();

        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.classList.add('hidden');
            appendMessage('system', 'An error occurred. Check your connection or login status.');
        }
    });

    function appendMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message animate-slide-up flex w-full max-w-4xl mx-auto ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        
        let innerHTML = '';

        if (sender === 'user') {
            innerHTML = `
                <div class="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-5 py-3.5 max-w-[85%] shadow-sm">
                    ${content}
                </div>
            `;
        } else if (sender === 'ai') {
            innerHTML = `
                <div class="flex gap-4 max-w-[90%] md:max-w-[85%] w-full">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-indigo-200">
                        <i class="fa-solid fa-scale-balanced text-sm text-indigo-600"></i>
                    </div>
                    <div class="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm w-full font-sans markdown-body overflow-x-auto">
                        ${content}
                    </div>
                </div>
            `;
        } else if (sender === 'system') {
            innerHTML = `
                <div class="mx-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100 shadow-sm flex items-center gap-2">
                    <i class="fa-solid fa-circle-exclamation"></i> ${content}
                </div>
            `;
        }

        messageDiv.innerHTML = innerHTML;
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    // Init Page State
    checkAuth();
});
