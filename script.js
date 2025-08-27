document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y DATOS ---
    const gameState = {
        score: 0,
        language: 'es',
        settings: {
            math: { level: 'easy' },
        },
        avatar: {
            items: [], // IDs de los items comprados
        }
    };

    // Base de datos de la tienda
    const shopItems = [
        { id: 'hat_1', name: 'Gorra', price: 50, icon: '🧢', type: 'hat' },
        { id: 'glasses_1', name: 'Gafas de Sol', price: 75, icon: '😎', type: 'glasses' },
        { id: 'mustache_1', name: 'Bigote', price: 100, icon: '👨🏻', type: 'feature' }, // Lo trataremos con CSS
        { id: 'crown_1', name: 'Corona', price: 500, icon: '👑', type: 'hat' },
    ];

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const scoreValueEl = document.getElementById('score-value');
    const views = document.querySelectorAll('.view');
    const langButtons = document.querySelectorAll('.lang-btn');
    const gameCards = document.querySelectorAll('#main-menu-view .game-card');
    const backButtons = document.querySelectorAll('.back-button');
    const avatarPreviewHeader = document.getElementById('avatar-preview-header');
    
    const settingsBtn = document.getElementById('settings-btn');
    const settingsView = document.getElementById('settings-view');
    const closeSettingsBtn = document.querySelector('#settings-view .close-button');
    const mathLevelSettingBtns = document.querySelectorAll('#math-level-setting .difficulty-btn');

    const currentMathLevelEl = document.getElementById('current-math-level');
    const mathProblemTextEl = document.getElementById('math-problem-text');
    const mathAnswerInputEl = document.getElementById('math-answer-input');
    const mathCheckBtn = document.getElementById('math-check-btn');
    const mathFeedbackTextEl = document.getElementById('math-feedback-text');
    let currentMathAnswer = 0;

    const shopItemsGrid = document.getElementById('shop-items-grid');

    // --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---
    function showView(viewId) {
        views.forEach(view => {
            if (!view.classList.contains('modal')) {
                view.classList.add('hidden');
            }
        });
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        } else {
            console.error(`Vista no encontrada: ${viewId}`);
        }
    }

    gameCards.forEach(card => {
        if (!card.classList.contains('disabled')) {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                if (gameId === 'math-challenge') startGameMath();
                if (gameId === 'shop') renderShop();
                showView(`${gameId}-view`);
            });
        }
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => showView('main-menu-view'));
    });

    // --- LÓGICA DE AJUSTES ---
    settingsBtn.addEventListener('click', () => {
        updateSettingsUI();
        settingsView.classList.remove('hidden');
    });
    closeSettingsBtn.addEventListener('click', () => settingsView.classList.add('hidden');

    function updateSettingsUI() {
        const currentMathLevel = gameState.settings.math.level;
        mathLevelSettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === currentMathLevel);
        });
    }

    mathLevelSettingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.settings.math.level = btn.dataset.level;
            saveState();
            updateSettingsUI();
        });
    });

    // --- LÓGICA DE LA TIENDA Y AVATAR ---
    function renderShop() {
        shopItemsGrid.innerHTML = '';
        shopItems.forEach(item => {
            const owned = gameState.avatar.items.includes(item.id);
            const canAfford = gameState.score >= item.price;

            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">${item.price} 🪙</div>
                <button class="buy-btn" data-item-id="${item.id}" ${owned || !canAfford ? 'disabled' : ''}>
                    ${owned ? 'Comprado' : 'Comprar'}
                </button>
            `;
            shopItemsGrid.appendChild(itemEl);
        });
    }
    
    // Event listener para los botones de compra (usando delegación)
    shopItemsGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-btn')) {
            const itemId = event.target.dataset.itemId;
            buyItem(itemId);
        }
    });

    function buyItem(itemId) {
        const item = shopItems.find(i => i.id === itemId);
        if (!item || gameState.avatar.items.includes(itemId) || gameState.score < item.price) {
            return; // No hacer nada si ya se tiene, no existe, o no hay dinero
        }
        updateScore(-item.price);
        gameState.avatar.items.push(itemId);
        saveState();
        renderShop(); // Re-renderizar la tienda para actualizar estado de botones
        renderAvatar(); // Re-renderizar el avatar
    }

    function renderAvatar() {
    // Limpiar items anteriores (excepto la base)
    avatarPreviewHeader.querySelectorAll('.avatar-item-preview').forEach(el => el.remove());
    
    gameState.avatar.items.forEach(itemId => {
        const item = shopItems.find(i => i.id === itemId);
        if (item) {
            const itemEl = document.createElement('div');
            // Añadimos una clase general y una específica para el tipo de item
            itemEl.className = `avatar-item-preview item-${item.type}`;
            itemEl.textContent = item.icon;
            
            // Un pequeño truco para aislar el bigote del emoji 👨🏻
            if (item.id === 'mustache_1') {
                itemEl.textContent = '〰️'; // Usamos un bigote de texto o un SVG si quisiéramos
                itemEl.style.fontSize = '1.2rem'; // Ajustamos tamaño
            }

            avatarPreviewHeader.appendChild(itemEl);
        }
    });
}

    // --- GUARDADO Y CARGA DE DATOS ---
    function saveState() {
        localStorage.setItem('valeriaGameState', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('valeriaGameState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            // Hacemos un merge cuidadoso
            gameState.score = loadedState.score || 0;
            gameState.language = loadedState.language || 'es';
            if (loadedState.settings) gameState.settings = loadedState.settings;
            if (loadedState.avatar) gameState.avatar = loadedState.avatar;
        }
        updateUI();
    }
    
    function updateUI() {
        scoreValueEl.textContent = gameState.score;
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === gameState.language);
        });
        renderAvatar();
    }

    // --- LÓGICA DEL JUEGO DE MATEMÁTICAS ---
    function startGameMath() {
        const level = gameState.settings.math.level;
        currentMathLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        generateMathProblem();
    }

    function generateMathProblem() {
        // (El código de esta función es idéntico al de la respuesta anterior)
        const level = gameState.settings.math.level;
        mathAnswerInputEl.value = '';
        mathFeedbackTextEl.textContent = '';
        mathAnswerInputEl.focus();
        const ops = ['+', '-'];
        let maxNum = 10;
        if (level === 'medium') { ops.push('*'); maxNum = 50; }
        else if (level === 'hard') { ops.push('*', '/'); maxNum = 100; }
        const op = ops[Math.floor(Math.random() * ops.length)];
        let num1 = Math.floor(Math.random() * maxNum) + 1;
        let num2 = Math.floor(Math.random() * maxNum) + 1;
        if (op === '-') { if (num1 < num2) [num1, num2] = [num2, num1]; currentMathAnswer = num1 - num2; }
        else if (op === '+') { currentMathAnswer = num1 + num2; }
        else if (op === '*') { if (level === 'medium') num2 = Math.floor(Math.random() * 9) + 1; currentMathAnswer = num1 * num2; }
        else if (op === '/') { num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); currentMathAnswer = num1 / num2; }
        mathProblemTextEl.textContent = `${num1} ${op} ${num2} = ?`;
    }

    function checkMathAnswer() {
        const userAnswer = parseInt(mathAnswerInputEl.value);
        if (userAnswer === currentMathAnswer) {
            mathFeedbackTextEl.textContent = '¡Correcto!';
            mathFeedbackTextEl.className = 'feedback-text correct';
            updateScore(10);
        } else {
            mathFeedbackTextEl.textContent = `¡Casi! La respuesta era ${currentMathAnswer}`;
            mathFeedbackTextEl.className = 'feedback-text incorrect';
            updateScore(-5);
        }
        setTimeout(generateMathProblem, 1500);
    }
    
    mathCheckBtn.addEventListener('click', checkMathAnswer);
    mathAnswerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') checkMathAnswer();
    });
    
    function updateScore(points) {
        gameState.score = Math.max(0, gameState.score + points); // Evitar puntuaciones negativas
        scoreValueEl.textContent = gameState.score;
        saveState();
    }
    
    // --- INICIALIZACIÓN ---
    function init() {
        loadState();
        showView('main-menu-view');
    }

    init();
});
