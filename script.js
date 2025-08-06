document.addEventListener('DOMContentLoaded', () => {
    // ---- 要素の取得 ----
    const screens = {
        auth: document.getElementById('auth-container'),
        mainMenu: document.getElementById('main-menu-container'),
        upload: document.getElementById('upload-section'),
        myCards: document.getElementById('my-cards-section'),
        flashcard: document.getElementById('flashcard-section'),
    };

    // 認証関連
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const authMessage = document.getElementById('auth-message');
    const loggedInUserSpan = document.getElementById('logged-in-user');
    const logoutBtn = document.getElementById('logout-btn');

    // メインメニュー
    const showUploadBtn = document.getElementById('show-upload-btn');
    const showMyCardsBtn = document.getElementById('show-my-cards-btn');

    // アップロード関連
    const csvFileInput = document.getElementById('csv-file');
    const cardSetNameInput = document.getElementById('card-set-name');
    const saveCardSetBtn = document.getElementById('save-card-set-btn');

    // Myカード関連
    const myCardsList = document.getElementById('my-cards-list');

    // フラッシュカード関連
    const flashcardContainer = document.getElementById('flashcard-container');
    const cardCounter = document.getElementById('card-counter');
    const flipCardBtn = document.getElementById('flip-card-btn');
    const nextCardBtn = document.getElementById('next-card-btn');

    // 戻るボタン
    const backButtons = document.querySelectorAll('.back-button');

    // ---- アプリケーションの状態 ----
    let loggedInUser = null;
    let currentCards = [];
    let uploadedCards = [];
    let currentCardIndex = 0;

    // ---- 機能 ----

    /**
     * 指定された画面を表示し、他をすべて隠す
     * @param {string} screenName 表示する画面のキー (screensオブジェクトのキー)
     */
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        if (screens[screenName]) {
            screens[screenName].classList.remove('hidden');
        }
    }

    /** ユーザーデータをlocalStorageから取得 */
    function getUsers() {
        return JSON.parse(localStorage.getItem('flashcard_users') || '{}');
    }

    /** ユーザーデータをlocalStorageに保存 */
    function saveUsers(users) {
        localStorage.setItem('flashcard_users', JSON.stringify(users));
    }
    
    /** カードセットデータをlocalStorageから取得 */
    function getCardSets() {
        return JSON.parse(localStorage.getItem('flashcard_sets') || '{}');
    }
    
    /** カードセットデータをlocalStorageに保存 */
    function saveCardSets(sets) {
        localStorage.setItem('flashcard_sets', JSON.stringify(sets));
    }


    // --- ユーザー認証 ---
    registerBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) {
            authMessage.textContent = 'IDとパスワードを入力してください。';
            return;
        }
        const users = getUsers();
        if (users[username]) {
            authMessage.textContent = 'このIDは既に使用されています。';
            return;
        }
        users[username] = password; // 簡単なため平文保存。実際はハッシュ化推奨
        saveUsers(users);
        authMessage.textContent = '登録が完了しました。ログインしてください。';
        usernameInput.value = '';
        passwordInput.value = '';
    });

    loginBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const users = getUsers();
        if (users[username] && users[username] === password) {
            loggedInUser = username;
            loggedInUserSpan.textContent = loggedInUser;
            usernameInput.value = '';
            passwordInput.value = '';
            authMessage.textContent = '';
            showScreen('mainMenu');
        } else {
            authMessage.textContent = 'IDまたはパスワードが間違っています。';
        }
    });

    logoutBtn.addEventListener('click', () => {
        loggedInUser = null;
        // 状態をリセット
        currentCards = [];
        uploadedCards = [];
        currentCardIndex = 0;
        csvFileInput.value = '';
        cardSetNameInput.value = '';
        showScreen('auth');
    });

    // --- メインメニューの画面遷移 ---
    showUploadBtn.addEventListener('click', () => showScreen('upload'));
    showMyCardsBtn.addEventListener('click', () => {
        displayMyCardSets();
        showScreen('myCards');
    });
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => showScreen('mainMenu'));
    });

    // --- CSV処理とカード保存 ---
    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                uploadedCards = parseCSVWithQuotes(text);
                if (uploadedCards.length > 0) {
                    alert(`${uploadedCards.length}枚のカードが読み込まれました。\n名前を付けて保存してください。`);
                    cardSetNameInput.focus();
                } else {
                    alert('有効なカードデータがCSVファイルに見つかりませんでした。');
                }
            } catch (error) {
                alert('CSVの解析に失敗しました。\n' + error.message);
                uploadedCards = [];
            }
        };
        reader.readAsText(file, 'UTF-8');
    });
    
    /**
     * ダブルクォーテーションで囲まれた改行を含むCSVをパースする
     * @param {string} text CSVのテキスト
     * @returns {Array<{front: string, back: string}>}
     */
    function parseCSVWithQuotes(text) {
        const pattern = /(?:"([^"]*(?:""[^"]*)*)"|([^",\n]+))(?=,|\n|$)/g;
        let lines = text.trim().split('\n');
        let cards = [];

        for (const line of lines) {
            if (line.trim() === '') continue;

            const matches = line.match(pattern);
            if (matches && matches.length >= 2) {
                const front = matches[0].replace(/^"|"$/g, '').replace(/""/g, '"');
                const back = matches[1].replace(/^"|"$/g, '').replace(/""/g, '"');
                cards.push({ front, back });
            }
        }
        return cards;
    }


    saveCardSetBtn.addEventListener('click', () => {
        const setName = cardSetNameInput.value.trim();
        if (!setName) {
            alert('カードセットの名前を入力してください。');
            return;
        }
        if (uploadedCards.length === 0) {
            alert('先にCSVファイルをアップロードしてください。');
            return;
        }

        const allCardSets = getCardSets();
        if (!allCardSets[loggedInUser]) {
            allCardSets[loggedInUser] = {};
        }
        allCardSets[loggedInUser][setName] = uploadedCards;
        saveCardSets(allCardSets);

        alert(`「${setName}」として保存しました。`);
        cardSetNameInput.value = '';
        csvFileInput.value = '';
        uploadedCards = [];
        showScreen('mainMenu');
    });

    // --- Myカード表示 ---
    function displayMyCardSets() {
        myCardsList.innerHTML = '';
        const allCardSets = getCardSets();
        const userSets = allCardSets[loggedInUser] || {};

        if (Object.keys(userSets).length === 0) {
            myCardsList.innerHTML = '<li>保存されたカードセットはありません。</li>';
            return;
        }

        const ul = document.createElement('ul');
        for (const setName in userSets) {
            const li = document.createElement('li');
            li.dataset.setName = setName;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = setName;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.className = 'delete-card-set';
            deleteBtn.dataset.setName = setName;

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
        }
        myCardsList.appendChild(ul);
        
        ul.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('delete-card-set')) {
                // 削除ボタンがクリックされた場合
                e.stopPropagation(); // liへのイベント伝播を停止
                const setName = target.dataset.setName;
                if (confirm(`「${setName}」を本当に削除しますか？`)) {
                    delete allCardSets[loggedInUser][setName];
                    saveCardSets(allCardSets);
                    displayMyCardSets(); // リストを再描画
                }
            } else if (target.closest('li')) {
                // li要素（またはその子要素）がクリックされた場合
                const setName = target.closest('li').dataset.setName;
                startFlashcards(userSets[setName]);
            }
        });
    }

    // --- フラッシュカード学習 ---
    function startFlashcards(cards) {
        currentCards = [...cards]; // カードデータをコピー
        currentCardIndex = 0;
        if (currentCards.length > 0) {
            showScreen('flashcard');
            renderFlashcard(currentCardIndex);
        } else {
            alert('このカードセットは空です。');
        }
    }
    
    function renderFlashcard(index) {
        flashcardContainer.innerHTML = ''; // コンテナをクリア
        nextCardBtn.textContent = '次へ進む';
        flipCardBtn.style.display = 'inline-block';
        // 「戻る」ボタン用のクリックイベントをリセット
        nextCardBtn.onclick = handleNextCard;

        if (index >= currentCards.length) {
            flashcardContainer.innerHTML = '<h2>すべてのカードが終了しました！</h2>';
            cardCounter.textContent = '完了';
            nextCardBtn.textContent = 'Myカード一覧に戻る';
            flipCardBtn.style.display = 'none';
            // 終了時の「戻る」ボタンの機能を設定
            nextCardBtn.onclick = () => {
                displayMyCardSets();
                showScreen('myCards');
            };
            return;
        }

        const cardData = currentCards[index];
        const flashcard = document.createElement('div');
        flashcard.className = 'flashcard';
        flashcard.innerHTML = `
            <div class="card-face card-front">${cardData.front}</div>
            <div class="card-face card-back">${cardData.back}</div>
        `;
        flashcardContainer.appendChild(flashcard);

        cardCounter.textContent = `${index + 1} / ${currentCards.length}`;
    }

    function handleFlipCard() {
        const flashcard = flashcardContainer.querySelector('.flashcard');
        if (flashcard) {
            flashcard.classList.toggle('flipped');
        }
    }

    function handleNextCard() {
        currentCardIndex++;
        renderFlashcard(currentCardIndex);
    }
    
    // イベントリスナーを設定
    flipCardBtn.addEventListener('click', handleFlipCard);
    nextCardBtn.addEventListener('click', handleNextCard);

    // ---- 初期化 ----
    showScreen('auth'); // 最初に認証画面を表示
});