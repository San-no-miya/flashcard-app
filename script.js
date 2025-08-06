document.addEventListener('DOMContentLoaded', () => {
    const csvFile = document.getElementById('csv-file');
    const flashcardContainer = document.getElementById('flashcard-container');

    // CSVファイルの読み込み
    csvFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const cards = parseCSV(text);
                renderFlashcards(cards);
            };
            reader.readAsText(file);
        }
    });

    // CSVをパースしてカードの配列を生成する関数
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        return lines.map(line => {
            const [front, back] = line.split(',');
            return { front: front.trim(), back: back.trim() };
        });
    }

    // フラッシュカードをレンダリングする関数
    function renderFlashcards(cards) {
        flashcardContainer.innerHTML = ''; // 既存のカードをクリア
        cards.forEach(cardData => {
            const cardElement = createFlashcard(cardData);
            flashcardContainer.appendChild(cardElement);
        });
    }

    // 個別のフラッシュカード要素を作成する関数
    function createFlashcard(cardData) {
        const flashcard = document.createElement('div');
        flashcard.classList.add('flashcard');

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-face', 'card-front');
        cardFront.textContent = cardData.front;

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-face', 'card-back');
        cardBack.textContent = cardData.back;

        flashcard.appendChild(cardFront);
        flashcard.appendChild(cardBack);

        // クリックイベントでカードを裏返す
        flashcard.addEventListener('click', () => {
            flashcard.classList.toggle('flipped');
        });

        return flashcard;
    }
});