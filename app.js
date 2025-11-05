// --- 1. 전역 변수 ---
let bookScreen, chapterScreen, textScreen, searchResultsScreen, memosScreen; // (memosScreen 추가)
let bookGridOt, bookGridNt;
let chapterGrid, textDisplay;
let chapterSelectionTitle, chapterDisplayTitle;
let backToBookListBtn, backToChapterListBtn;
let toggleLeftBtn, toggleRightBtn, currentTranslationSpan;
let chapterScroller;
let quickJumpBook, quickJumpChapter, quickJumpGo;
let topSearchInput, topSearchButton;
let quickJumpSearchInput, quickJumpSearchGo;
let searchResultsList, searchResultsTitle;
let backFromSearchBtn, backFromMemosBtn; // (backFromMemosBtn 추가)
let lastActiveScreen = 'book';
let selectionControls, selectionCountSpan, copyButton, selectAllButton, deselectAllButton;
let selectedVerses = new Set();
const TRANSLATIONS = ["개역한글", "개역한글(한자)"];
let currentTranslationIndex = 0; 
let currentBook = '';
let currentChapter = 0;
let currentChapterCount = 0;

// (새 변수) 테마 스위치
let themeToggles = []; // 모든 테마 스위치를 담을 배열

// (새 변수) 메모 모달 UI
let memoModalOverlay, memoModal, memoWordTitle, memoTextarea;
let memoSaveButton, memoCloseButton, memoDeleteButton;
let currentMemoKey = ''; // 현재 편집 중인 메모의 고유 키
let currentMemoType = ''; // 'word', 'book', 'chapter'
let currentMemoTargetElement = null; // 메모 스타일을 즉시 변경할 DOM 요소

// (새 변수) '내 메모' 화면 UI
let myMemosButton, memosListContainer;

// (새 변수) 책/장 메모 버튼
let bookMemoButton, chapterMemoButton;


// --- 2. 앱 초기화 ---
window.addEventListener('DOMContentLoaded', () => {
    
    // (중요!) 2-1. 모든 HTML 요소를 찾고, 실패 시 즉시 오류 보고
    try {
        bookScreen = document.getElementById('book-screen');
        chapterScreen = document.getElementById('chapter-screen');
        textScreen = document.getElementById('text-screen');
        searchResultsScreen = document.getElementById('search-results-screen');
        memosScreen = document.getElementById('memos-screen'); // (추가)
        
        bookGridOt = document.getElementById('book-selection-grid-ot');
        bookGridNt = document.getElementById('book-selection-grid-nt');
        chapterGrid = document.getElementById('chapter-selection-grid');
        textDisplay = document.getElementById('chapter-display');
        chapterSelectionTitle = document.getElementById('chapter-selection-title');
        chapterDisplayTitle = document.getElementById('chapter-display-title');
        backToBookListBtn = document.getElementById('back-to-book-list');
        backToChapterListBtn = document.getElementById('back-to-chapter-list');
        toggleLeftBtn = document.getElementById('toggle-left');
        toggleRightBtn = document.getElementById('toggle-right');
        currentTranslationSpan = document.getElementById('current-translation');
        chapterScroller = document.getElementById('chapter-scroller');
        quickJumpBook = document.getElementById('quick-jump-book');
        quickJumpChapter = document.getElementById('quick-jump-chapter');
        quickJumpGo = document.getElementById('quick-jump-go');
        topSearchInput = document.getElementById('top-search-input');
        topSearchButton = document.getElementById('top-search-button');
        quickJumpSearchInput = document.getElementById('quick-jump-search');
        quickJumpSearchGo = document.getElementById('quick-jump-search-go');
        searchResultsList = document.getElementById('search-results-list');
        searchResultsTitle = document.getElementById('search-results-title');
        backFromSearchBtn = document.getElementById('back-from-search');
        selectionControls = document.getElementById('selection-controls');
        selectionCountSpan = document.getElementById('selection-count');
        copyButton = document.getElementById('copy-button');
        selectAllButton = document.getElementById('select-all-button');
        deselectAllButton = document.getElementById('deselect-all-button');
        
        themeToggles = document.querySelectorAll('.theme-toggle-input');

        memoModalOverlay = document.getElementById('memo-modal-overlay');
        memoModal = document.getElementById('memo-modal');
        memoWordTitle = document.getElementById('memo-word-title');
        memoTextarea = document.getElementById('memo-textarea');
        memoSaveButton = document.getElementById('memo-save-button');
        memoCloseButton = document.getElementById('memo-close-button');
        memoDeleteButton = document.getElementById('memo-delete-button');

        // (새 요소) '내 메모' 관련
        myMemosButton = document.getElementById('my-memos-button');
        memosListContainer = document.getElementById('memos-list-container');
        backFromMemosBtn = document.getElementById('back-from-memos');
        
        // (새 요소) 책/장 메모 버튼
        bookMemoButton = document.getElementById('book-memo-button');
        chapterMemoButton = document.getElementById('chapter-memo-button');


        // (중요) 하나라도 null이면 여기서 오류 발생 (먹통의 근본 원인)
        if (!bookScreen || !chapterGrid || !memoModalOverlay || !themeToggles.length || !myMemosButton || !bookMemoButton || !chapterMemoButton) {
            throw new Error("필수 HTML 요소 중 일부를 찾을 수 없습니다. index.html 파일이 최신 버전인지 확인하세요.");
        }

    } catch (error) {
        console.error("앱 초기화 실패 (HTML 요소 누락):", error.message);
        document.body.innerHTML = `<h1 style="color:red; padding: 20px;">앱 로딩 실패!</h1><p style="padding: 20px;">${error.message}</p><p style="padding: 20px;">F12를 눌러 콘솔을 확인하고, index.html 파일이 올바르게 저장되었는지 확인하세요.</p>`;
        return; // 앱 실행 중단
    }

    // 2-2. 기본 기능 초기화
    generateBookList();
    populateBookDropdown();

    // 2-3. '사전/메모'를 위한 이벤트 위임 리스너
    textDisplay.addEventListener('click', handleTextClick);

    // 2-4. 테마 스위치 로직
    const currentTheme = localStorage.getItem('bible-theme') || 'dark'; // 기본값 다크
    setTheme(currentTheme);
    themeToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const newTheme = toggle.checked ? 'dark' : 'light';
            setTheme(newTheme);
            localStorage.setItem('bible-theme', newTheme);
        });
    });

    // 2-5. 메모 모달 버튼 리스너
    memoSaveButton.addEventListener('click', saveMemo);
    memoCloseButton.addEventListener('click', closeMemoModal);
    memoDeleteButton.addEventListener('click', deleteMemo);
    memoModalOverlay.addEventListener('click', (e) => {
        if (e.target === memoModalOverlay) closeMemoModal();
    });
    
    // 2-6. (새 기능) '내 메모' 및 책/장 메모 버튼 리스너
    myMemosButton.addEventListener('click', () => {
        showScreen('memos');
        generateMemosList(); // '내 메모' 화면 열 때마다 목록 갱신
    });
    backFromMemosBtn.addEventListener('click', () => showScreen('book'));
    
    bookMemoButton.addEventListener('click', () => {
        openMemoModal(currentBook, 'book');
    });
    chapterMemoButton.addEventListener('click', () => {
        openMemoModal(`${currentBook} ${currentChapter}장`, 'chapter');
    });


    // 2-7. 검색 버튼 이벤트 리스너
    topSearchButton.addEventListener('click', () => {
        lastActiveScreen = 'book';
        handleSearch(topSearchInput.value);
    });
    quickJumpSearchGo.addEventListener('click', () => {
        lastActiveScreen = 'text';
        handleSearch(quickJumpSearchInput.value);
    });
    topSearchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') topSearchButton.click(); });
    quickJumpSearchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') quickJumpSearchGo.click(); });
    backFromSearchBtn.addEventListener('click', () => {
        if (lastActiveScreen === 'text') {
            showScreen('text');
        } else {
            showScreen('book');
        }
    });

    // 2-8. 드롭다운 이벤트 리스너
    quickJumpBook.addEventListener('change', () => {
        populateChapterDropdown(quickJumpBook.value);
    });
    quickJumpGo.addEventListener('click', () => {
        jumpToSelection();
    });

    // 2-9. 토글 버튼 이벤트 리스너
    toggleLeftBtn.addEventListener('click', () => {
        currentTranslationIndex = (currentTranslationIndex - 1 + TRANSLATIONS.length) % TRANSLATIONS.length;
        renderChapterText();
    });
    toggleRightBtn.addEventListener('click', () => {
        currentTranslationIndex = (currentTranslationIndex + 1) % TRANSLATIONS.length;
        renderChapterText();
    });

    // 2-10. 선택 제어판 버튼 이벤트 리스너
    copyButton.addEventListener('click', copySelectedVerses);
    selectAllButton.addEventListener('click', selectAllVerses);
    deselectAllButton.addEventListener('click', clearAllSelections);
});

// --- (새 기능) 테마 설정 헬퍼 ---
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggles.forEach(toggle => toggle.checked = true);
    } else {
        document.body.classList.remove('dark-mode');
        themeToggles.forEach(toggle => toggle.checked = false);
    }
}


// --- 화면 전환 관리 ---
function showScreen(screenName) {
    bookScreen.classList.add('hidden');
    chapterScreen.classList.add('hidden');
    textScreen.classList.add('hidden');
    searchResultsScreen.classList.add('hidden');
    memosScreen.classList.add('hidden'); // (추가)

    if (screenName === 'book') bookScreen.classList.remove('hidden');
    else if (screenName === 'chapter') chapterScreen.classList.remove('hidden');
    else if (screenName === 'text') textScreen.classList.remove('hidden');
    else if (screenName === 'search') searchResultsScreen.classList.remove('hidden');
    else if (screenName === 'memos') memosScreen.classList.remove('hidden'); // (추가)
    
    if (screenName !== 'text') {
        clearAllSelections();
    }
}

// --- 3. [화면 1] 책 목록 생성 ---
function generateBookList() {
    // (버그 수정) 요소가 존재하는지 확인
    if (!bookGridOt || !bookGridNt) return; 
    
    bookGridOt.innerHTML = '';
    bookGridNt.innerHTML = '';
    BIBLE_BOOKS.forEach(book => {
        const bookName = book.name;
        const chapterCount = book.chapters;
        const testament = book.testament;
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.textContent = bookName;
        item.onclick = () => showChapterList(bookName, chapterCount);
        if (testament === '구약') {
            item.classList.add('book-ot'); bookGridOt.appendChild(item);
        } else {
            item.classList.add('book-nt'); bookGridNt.appendChild(item);
        }
    });
}

// --- 4. [화면 2] 장(Chapter) 목록 ---
function showChapterList(bookName, chapterCount) {
    showScreen('chapter'); 
    chapterSelectionTitle.textContent = bookName;
    chapterGrid.innerHTML = ''; 
    backToBookListBtn.onclick = () => showScreen('book');
    
    // (새 기능) '책 메모' 버튼이 현재 책을 알도록 함
    bookMemoButton.onclick = () => {
        openMemoModal(bookName, 'book');
    };
    
    for (let i = 1; i <= chapterCount; i++) {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.textContent = i;
        item.onclick = () => showChapterText(bookName, i, chapterCount);
        chapterGrid.appendChild(item);
    }
}

// --- 5. [화면 3] 본문(Chapter Text) 표시 ---
function showChapterText(bookName, chapterNum, chapterCount) {
    showScreen('text'); 
    clearAllSelections();
    currentBook = bookName;
    currentChapter = chapterNum;
    currentChapterCount = chapterCount;
    backToChapterListBtn.onclick = () => showChapterList(currentBook, currentChapterCount);
    
    // (새 기능) '장 메모' 버튼이 현재 장을 알도록 함
    chapterMemoButton.onclick = () => {
        openMemoModal(`${currentBook} ${currentChapter}장`, 'chapter');
    };
    
    renderChapterText();
    generateChapterScroller();
    updateDropdowns();
}

// --- 6. 본문 렌더링 함수 (두 가지 구조 처리) ---
function renderChapterText() {
    clearAllSelections(); 
    const translationName = TRANSLATIONS[currentTranslationIndex];
    currentTranslationSpan.textContent = translationName; 
    chapterDisplayTitle.textContent = `${currentBook} ${currentChapter}장`;
    textDisplay.innerHTML = ''; 
    try {
        if (translationName === "개역한글") {
            const chapterKey = String(currentChapter);
            const versesArray = BIBLE_TEXT_DATA[translationName][currentBook][chapterKey];
            if (!versesArray) throw new Error("개역한글 데이터를 찾을 수 없습니다.");
            versesArray.forEach((verseText, index) => {
                appendVerseToDisplay(index + 1, verseText);
            });
        } else if (translationName === "개역한글(한자)") {
            if (typeof Bible === 'undefined') throw new Error("data_hanja.js 로드 실패");
            const chapterVerses = Bible.filter(verseObj => 
                verseObj.name === currentBook && 
                verseObj.chapter === currentChapter
            );
            if (chapterVerses.length === 0) throw new Error("한자 데이터를 찾을 수 없습니다.");
            chapterVerses.forEach(verseObj => {
                appendVerseToDisplay(verseObj.verse, verseObj.text);
            });
        }
    } catch (error) {
        console.error("본문 로딩 오류:", error);
        textDisplay.innerHTML = `<p>'${translationName}' 버전의 본문을 불러오는 중 오류가 발생했습니다.</p><p style="color:red;">${error.message}</p>`;
    }
}

// --- 7. (핵심 수정) 본문 <p> 태그 추가 (단어 메모 로직) ---
function appendVerseToDisplay(verseNum, verseText) {
    const p = document.createElement('p');
    p.className = 'verse'; 
    p.dataset.book = currentBook;
    p.dataset.chapter = currentChapter;
    p.dataset.verse = verseNum;
    const verseId = `${currentBook}_${currentChapter}_${verseNum}`;
    p.dataset.verseId = verseId;
    
    const sup = document.createElement('sup');
    sup.textContent = verseNum;
    sup.addEventListener('click', (e) => {
        e.stopPropagation(); 
        handleVerseClick(p, verseId);
    });
    p.appendChild(sup);

    let processedText = verseText;
    const translationName = TRANSLATIONS[currentTranslationIndex];
    const regex = /([\uAC00-\uD7A3]+|[\u4E00-\u9FFF]+)/g;

    if (translationName === "개역한글") {
        processedText = verseText.replace(regex, (match, word) => {
            if (/[\u4E00-\u9FFF]/.test(match)) {
                return match; 
            }
            const memoKey = getMemoKey(word, 'word');
            const memoExists = localStorage.getItem(memoKey);
            if (memoExists) {
                return `<span class="word-memo" data-word="${word}">${match}</span>`;
            } else {
                return `<span class="word-general" data-word="${word}">${match}</span>`;
            }
        });
    } 
    else if (translationName === "개역한글(한자)") {
        processedText = verseText.replace(regex, (match, word) => {
            if (/[\u4E00-\u9FFF]/.test(match)) {
                return `<span class="word-hanja" data-word="${match}">${match}</span>`;
            } else {
                return match;
            }
        });
    }

    const textSpan = document.createElement('span');
    textSpan.innerHTML = ` ${processedText}`; 
    p.appendChild(textSpan);
    
    textDisplay.appendChild(p);
}


// --- 8. 검색 로직 (변경 없음) ---
function handleSearch(keyword) {
    if (!keyword || keyword.trim() === '') { alert("검색어를 입력해주세요."); return; }
    topSearchInput.value = keyword;
    quickJumpSearchInput.value = keyword;
    const results = [];
    BIBLE_BOOKS.forEach(book => {
        const bookName = book.name;
        const bookData = BIBLE_TEXT_DATA["개역한글"][bookName];
        if (!bookData) return;
        Object.keys(bookData).forEach(chapterKey => {
            const chapterNum = parseInt(chapterKey, 10);
            const versesArray = bookData[chapterKey];
            versesArray.forEach((verseText, verseIndex) => {
                if (verseText.includes(keyword)) {
                    results.push({ book: bookName, chapter: chapterNum, verse: verseIndex + 1, text: verseText });
                }
            });
        });
    });
    displaySearchResults(results, keyword);
}
function displaySearchResults(results, keyword) {
    showScreen('search');
    searchResultsList.innerHTML = '';
    searchResultsTitle.textContent = `"${keyword}" 검색 결과 (${results.length}건)`;
    if (results.length === 0) { searchResultsList.innerHTML = '<p>검색 결과가 없습니다.</p>'; return; }
    const regex = new RegExp(keyword, 'g');
    results.forEach(result => {
        const highlightedText = result.text.replace(regex, `<mark>${keyword}</mark>`);
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const bookData = BIBLE_BOOKS.find(b => b.name === result.book);
        const chapterCount = bookData ? bookData.chapters : 0;
        item.innerHTML = `<strong>${result.book} ${result.chapter}:${result.verse}</strong><p>${highlightedText}</p>`;
        item.onclick = () => { showChapterText(result.book, result.chapter, chapterCount); };
        searchResultsList.appendChild(item);
    });
}

// --- 9. 빠른 이동 관련 함수들 (변경 없음) ---
function populateBookDropdown() {
    if (!quickJumpBook) return; // (버그 방지)
    quickJumpBook.innerHTML = '';
    BIBLE_BOOKS.forEach(book => {
        const option = document.createElement('option');
        option.value = book.name; option.textContent = book.name;
        quickJumpBook.appendChild(option);
    });
    populateChapterDropdown(BIBLE_BOOKS[0].name);
}
function populateChapterDropdown(selectedBookName) {
    const bookData = BIBLE_BOOKS.find(b => b.name === selectedBookName);
    if (!bookData) return;
    const chapterCount = bookData.chapters;
    quickJumpChapter.innerHTML = '';
    for (let i = 1; i <= chapterCount; i++) {
        const option = document.createElement('option');
        option.value = i; option.textContent = `${i}장`;
        quickJumpChapter.appendChild(option);
    }
}
function jumpToSelection() {
    const bookName = quickJumpBook.value;
    const chapterNum = parseInt(quickJumpChapter.value, 10);
    const bookData = BIBLE_BOOKS.find(b => b.name === bookName);
    if (bookData) {
        showChapterText(bookName, chapterNum, bookData.chapters);
    }
}
function generateChapterScroller() {
    chapterScroller.innerHTML = '';
    for (let i = 1; i <= currentChapterCount; i++) {
        const btn = document.createElement('button');
        btn.className = 'chapter-scroll-btn';
        btn.textContent = i;
        btn.onclick = () => showChapterText(currentBook, i, currentChapterCount);
        if (i === currentChapter) { btn.classList.add('active'); }
        chapterScroller.appendChild(btn);
    }
    const activeButton = chapterScroller.querySelector('.active');
    if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', 'block': 'nearest' });
    }
}
function updateDropdowns() {
    quickJumpBook.value = currentBook;
    populateChapterDropdown(currentBook);
    quickJumpChapter.value = currentChapter;
}

// --- 10. 구절 선택/복사 관련 함수들 (변경 없음) ---
function handleVerseClick(pElement, verseId) {
    if (selectedVerses.has(verseId)) {
        selectedVerses.delete(verseId);
        pElement.classList.remove('verse-selected');
    } else {
        selectedVerses.add(verseId);
        pElement.classList.add('verse-selected');
    }
    updateSelectionControls();
}
function updateSelectionControls() {
    const count = selectedVerses.size;
    if (count > 0) {
        selectionCountSpan.textContent = `${count}개 구절 선택됨`;
        selectionControls.classList.remove('hidden');
    } else {
        selectionControls.classList.add('hidden');
    }
}
function clearAllSelections() {
    selectedVerses.clear(); 
    document.querySelectorAll('#chapter-display p.verse-selected').forEach(p => {
        p.classList.remove('verse-selected');
    });
    updateSelectionControls(); 
}
function selectAllVerses() {
    const allVerseElements = document.querySelectorAll('#chapter-display p.verse');
    allVerseElements.forEach(p => {
        if (!selectedVerses.has(p.dataset.verseId)) {
            selectedVerses.add(p.dataset.verseId);
            p.classList.add('verse-selected');
        }
    });
    updateSelectionControls();
}
async function copySelectedVerses() {
    const count = selectedVerses.size;
    if (count === 0) return;
    const sortedIds = Array.from(selectedVerses).sort((a, b) => {
        const [bookA, chapA, verseA] = a.split('_');
        const [bookB, chapB, verseB] = b.split('_');
        if (bookA !== bookB) return bookA.localeCompare(bookB);
        if (parseInt(chapA) !== parseInt(chapB)) return parseInt(chapA) - parseInt(chapB);
        return parseInt(verseA) - parseInt(verseB);
    });
    let copyText = ""; 
    for (const verseId of sortedIds) {
        const pElement = document.querySelector(`p[data-verse-id="${verseId}"]`);
        if (!pElement) continue;
        const [book, chapter, verse] = verseId.split('_');
        const textSpan = pElement.querySelector('span');
        const pureText = textSpan ? textSpan.textContent.trim() : '';
        copyText += `(${book} ${chapter}:${verse}) ${pureText}\n`;
    }
    try {
        await navigator.clipboard.writeText(copyText);
        alert(`${count}개 구절이 복사되었습니다.`);
        clearAllSelections();
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        alert('복사에 실패했습니다.');
    }
}

// --- 11. (수정) 사전/메모 클릭 처리 ---
function handleTextClick(event) {
    const target = event.target; 
    
    // 1. '개역한글'의 일반 단어 클릭 시 (메모)
    if (target.classList.contains('word-general')) {
        openMemoModal(target.dataset.word, 'word', target);
    }
    // 2. '개역한글'의 메모된 단어 클릭 시 (메모)
    else if (target.classList.contains('word-memo')) {
        openMemoModal(target.dataset.word, 'word', target);
    }
    // 3. '한자' 버전의 한자 단어 클릭 시 (사전)
    else if (target.classList.contains('word-hanja')) {
        const word = target.dataset.word;
        const url = `https://hanja.dict.naver.com/#/search?query=${encodeURIComponent(word)}`;
        window.open(url, '_blank');
    }
}

// --- 12. (수정) 범용 메모 관련 함수들 ---

/**
 * (A) 메모를 위한 고유 키 생성
 * @param {string} key (예: "태초", "창세기", "창세기 1장")
 * @param {string} type (예: "word", "book", "chapter")
 */
function getMemoKey(key, type) {
    if (type === 'word') return `wordmemo_${key}`;
    if (type === 'book') return `bookmemo_${key}`;
    if (type === 'chapter') return `chapmemo_${key.replace(' ', '_')}`; // "창세기 1장" -> "창세기_1장"
    return `memo_${key}`;
}

/**
 * (B) 메모 모달(팝업) 열기
 */
function openMemoModal(key, type, targetElement = null) {
    currentMemoKey = getMemoKey(key, type);
    currentMemoType = type;
    currentMemoTargetElement = targetElement; // 단어 스타일 변경을 위해 저장
    
    memoWordTitle.textContent = `'${key}' 메모`;
    
    const savedMemo = localStorage.getItem(currentMemoKey);
    if (savedMemo) {
        memoTextarea.value = savedMemo;
        memoDeleteButton.classList.remove('hidden');
    } else {
        memoTextarea.value = '';
        memoDeleteButton.classList.add('hidden');
    }
    
    memoModalOverlay.classList.remove('hidden');
    memoTextarea.focus();
}

/**
 * (C) 메모 모달(팝업) 닫기
 */
function closeMemoModal() {
    memoModalOverlay.classList.add('hidden');
    currentMemoKey = '';
    currentMemoType = '';
    currentMemoTargetElement = null;
}

/**
 * (D) '저장' 버튼 클릭 시
 */
function saveMemo() {
    const textToSave = memoTextarea.value;
    
    if (currentMemoKey && textToSave) {
        localStorage.setItem(currentMemoKey, textToSave);
        
        // (단어 메모) 저장 시 '진하게' 스타일 즉시 적용
        if (currentMemoType === 'word' && currentMemoTargetElement) {
            currentMemoTargetElement.classList.remove('word-general');
            currentMemoTargetElement.classList.add('word-memo');
        }
    } else if (currentMemoKey) {
        // 텍스트가 비어있으면 삭제
        deleteMemo();
    }
    
    closeMemoModal();
}

/**
 * (E) '삭제' 버튼 클릭 시
 */
function deleteMemo() {
    if (currentMemoKey) {
        localStorage.removeItem(currentMemoKey);
        
        // (단어 메모) 삭제 시 '일반' 스타일로 즉시 복구
        if (currentMemoType === 'word' && currentMemoTargetElement) {
            currentMemoTargetElement.classList.remove('word-memo');
            currentMemoTargetElement.classList.add('word-general');
        }
    }
    closeMemoModal();
}

// --- 13. (새 기능) '내 메모' 화면 생성 ---
function generateMemosList() {
    memosListContainer.innerHTML = ''; // 목록 비우기
    let hasMemos = false;

    // localStorage의 모든 키를 순회
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        let title = '';
        let type = '';
        let book = '';
        let chapter = 0;

        if (key.startsWith('bookmemo_')) {
            title = key.replace('bookmemo_', '');
            type = '책 메모';
            book = title;
        } else if (key.startsWith('chapmemo_')) {
            title = key.replace('chapmemo_', '').replace('_', ' '); // "창세기_1장" -> "창세기 1장"
            type = '장 메모';
            [book, chapter] = title.split(' ');
            chapter = parseInt(chapter.replace('장', ''));
        } else if (key.startsWith('wordmemo_')) {
            title = `'${key.replace('wordmemo_', '')}' 단어 메모`;
            type = '단어 메모';
        }

        if (type) {
            hasMemos = true;
            const item = document.createElement('div');
            item.className = 'memo-list-item';
            item.innerHTML = `
                <h4>${title} <span>(${type})</span></h4>
                <p>${value.replace(/\n/g, '<br>')}</p> `;
            
            // 책/장 메모는 클릭 시 해당 위치로 이동
            if (type === '책 메모') {
                const bookData = BIBLE_BOOKS.find(b => b.name === book);
                if (bookData) {
                    item.onclick = () => showChapterList(book, bookData.chapters);
                }
            } else if (type === '장 메모') {
                 const bookData = BIBLE_BOOKS.find(b => b.name === book);
                if (bookData) {
                    item.onclick = () => showChapterText(book, chapter, bookData.chapters);
                }
            } else {
                // 단어 메모는 클릭 시 수정 모달 열기
                item.onclick = () => openMemoModal(key.replace('wordmemo_', ''), 'word');
            }
            
            memosListContainer.appendChild(item);
        }
    }

    if (!hasMemos) {
        memosListContainer.innerHTML = '<p>저장된 메모가 없습니다.</p>';
    }
}