// --- 1. 전역 변수 ---
let bookScreen, chapterScreen, textScreen, searchResultsScreen, memosScreen; // (memosScreen 추가)
let bookGridOt, bookGridNt;
let chapterGrid, textDisplay, footnoteContainer; // (footnoteContainer 추가)
let chapterSelectionTitle, chapterDisplayTitle;
let backToBookListBtn, backToChapterListBtn;
let toggleLeftBtn, toggleRightBtn, currentTranslationSpan;
let chapterScroller;
let quickJumpBook, quickJumpChapter, quickJumpGo;
let topSearchInput, topSearchButton, topSearchType; // (topSearchType 추가)
let quickJumpSearchInput, quickJumpSearchGo, quickSearchType; // (quickSearchType 추가)
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

let themeToggles = []; // 모든 테마 스위치를 담을 배열
let homeButtons = []; // (추가) 모든 홈 버튼

let memoModalOverlay, memoModal, memoWordTitle, memoTextarea;
let memoSaveButton, memoCloseButton, memoDeleteButton;
let currentMemoKey = ''; // 현재 편집 중인 메모의 고유 키
let currentMemoType = ''; // 'word', 'book', 'chapter'
let currentMemoTargetElement = null; // 메모 스타일을 즉시 변경할 DOM 요소

let myMemosButton, memosListContainer;
let bookMemoButton, chapterMemoButton;

// (새 변수) 각주 렌더링을 위한 임시 저장소
let chapterFootnotes = [];


// --- 2. 앱 초기화 ---
window.addEventListener('DOMContentLoaded', () => {
    
    // (중요!) 2-1. 모든 HTML 요소를 찾고, 실패 시 즉시 오류 보고
    try {
        bookScreen = document.getElementById('book-screen');
        chapterScreen = document.getElementById('chapter-screen');
        textScreen = document.getElementById('text-screen');
        searchResultsScreen = document.getElementById('search-results-screen');
        memosScreen = document.getElementById('memos-screen');
        
        bookGridOt = document.getElementById('book-selection-grid-ot');
        bookGridNt = document.getElementById('book-selection-grid-nt');
        chapterGrid = document.getElementById('chapter-selection-grid');
        textDisplay = document.getElementById('chapter-display');
        footnoteContainer = document.getElementById('footnote-container');
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
        topSearchType = document.getElementById('top-search-type');
        quickJumpSearchInput = document.getElementById('quick-jump-search');
        quickJumpSearchGo = document.getElementById('quick-jump-search-go');
        quickSearchType = document.getElementById('quick-search-type');
        searchResultsList = document.getElementById('search-results-list');
        searchResultsTitle = document.getElementById('search-results-title');
        backFromSearchBtn = document.getElementById('back-from-search');
        selectionControls = document.getElementById('selection-controls');
        selectionCountSpan = document.getElementById('selection-count');
        copyButton = document.getElementById('copy-button');
        selectAllButton = document.getElementById('select-all-button');
        deselectAllButton = document.getElementById('deselect-all-button');
        
        themeToggles = document.querySelectorAll('.theme-toggle-input');
        homeButtons = document.querySelectorAll('.home-button'); // (추가)

        memoModalOverlay = document.getElementById('memo-modal-overlay');
        memoModal = document.getElementById('memo-modal');
        memoWordTitle = document.getElementById('memo-word-title');
        memoTextarea = document.getElementById('memo-textarea');
        memoSaveButton = document.getElementById('memo-save-button');
        memoCloseButton = document.getElementById('memo-close-button');
        memoDeleteButton = document.getElementById('memo-delete-button');

        myMemosButton = document.getElementById('my-memos-button');
        memosListContainer = document.getElementById('memos-list-container');
        backFromMemosBtn = document.getElementById('back-from-memos');
        
        bookMemoButton = document.getElementById('book-memo-button');
        chapterMemoButton = document.getElementById('chapter-memo-button');

        // (중요) 하나라도 null이면 여기서 오류 발생 (먹통의 근본 원인)
        if (!bookScreen || !chapterGrid || !memoModalOverlay || !themeToggles.length || !myMemosButton || !bookMemoButton || !chapterMemoButton || !footnoteContainer || !topSearchType || !homeButtons.length) {
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

    // 2-4. (새 기능) 테마 스위치 로직
    const currentTheme = localStorage.getItem('bible-theme') || 'dark'; // 기본값 다크
    setTheme(currentTheme);
    themeToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const newTheme = toggle.checked ? 'dark' : 'light';
            setTheme(newTheme);
            localStorage.setItem('bible-theme', newTheme);
        });
    });
    
    // 2-5. (새 기능) 홈 버튼 리스너
    homeButtons.forEach(button => {
        button.addEventListener('click', () => showScreen('book'));
    });

    // 2-6. (새 기능) 메모 모달 버튼 리스너
    memoSaveButton.addEventListener('click', saveMemo);
    memoCloseButton.addEventListener('click', closeMemoModal);
    memoDeleteButton.addEventListener('click', deleteMemo);
    memoModalOverlay.addEventListener('click', (e) => {
        if (e.target === memoModalOverlay) closeMemoModal();
    });
    
    // 2-7. (새 기능) '내 메모' 및 책/장 메모 버튼 리스너
    myMemosButton.addEventListener('click', () => {
        showScreen('memos');
        generateMemosList();
    });
    backFromMemosBtn.addEventListener('click', () => showScreen('book'));
    bookMemoButton.addEventListener('click', () => openMemoModal(currentBook, 'book'));
    chapterMemoButton.addEventListener('click', () => openMemoModal(`${currentBook} ${currentChapter}장`, 'chapter'));


    // 2-8. 검색 버튼 이벤트 리스너
    topSearchButton.addEventListener('click', () => {
        lastActiveScreen = 'book';
        handleSearch(topSearchInput.value, topSearchType.value);
    });
    quickJumpSearchGo.addEventListener('click', () => {
        lastActiveScreen = 'text';
        handleSearch(quickJumpSearchInput.value, quickSearchType.value);
    });
    topSearchInput.addEventListener('keyup', (e) => {
        quickJumpSearchInput.value = topSearchInput.value;
        if (e.key === 'Enter') topSearchButton.click();
    });
    quickJumpSearchInput.addEventListener('keyup', (e) => {
        topSearchInput.value = quickJumpSearchInput.value;
        if (e.key === 'Enter') quickJumpSearchGo.click();
    });
    topSearchType.addEventListener('change', () => quickSearchType.value = topSearchType.value);
    quickSearchType.addEventListener('change', () => topSearchType.value = quickSearchType.value);
    backFromSearchBtn.addEventListener('click', () => {
        if (lastActiveScreen === 'text') {
            showScreen('text');
        } else {
            showScreen('book');
        }
    });

    // 2-9. 드롭다운 이벤트 리스너
    quickJumpBook.addEventListener('change', () => populateChapterDropdown(quickJumpBook.value));
    quickJumpGo.addEventListener('click', () => jumpToSelection());

    // 2-10. 토글 버튼 이벤트 리스너
    toggleLeftBtn.addEventListener('click', () => {
        currentTranslationIndex = (currentTranslationIndex - 1 + TRANSLATIONS.length) % TRANSLATIONS.length;
        renderChapterText();
    });
    toggleRightBtn.addEventListener('click', () => {
        currentTranslationIndex = (currentTranslationIndex + 1) % TRANSLATIONS.length;
        renderChapterText();
    });

    // 2-11. 선택 제어판 버튼 이벤트 리스너
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
    memosScreen.classList.add('hidden');

    if (screenName === 'book') bookScreen.classList.remove('hidden');
    else if (screenName === 'chapter') chapterScreen.classList.remove('hidden');
    else if (screenName === 'text') textScreen.classList.remove('hidden');
    else if (screenName === 'search') searchResultsScreen.classList.remove('hidden');
    else if (screenName === 'memos') memosScreen.classList.remove('hidden');
    
    if (screenName !== 'text') {
        clearAllSelections();
    }
}

// --- 3. [화면 1] 책 목록 생성 ---
function generateBookList() {
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
    bookMemoButton.onclick = () => openMemoModal(bookName, 'book');
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
    
    // (버그 수정!) 'backToBookListBtn'이 아니라 'backToChapterListBtn'에 할당
    backToChapterListBtn.onclick = () => showChapterList(currentBook, currentChapterCount);
    
    chapterMemoButton.onclick = () => openMemoModal(`${currentBook} ${currentChapter}장`, 'chapter');
    
    renderChapterText();
    generateChapterScroller();
    updateDropdowns();
}

// --- 6. (수정) 본문 렌더링 + 각주 생성 ---
function renderChapterText() {
    clearAllSelections();
    chapterFootnotes = [];
    
    const translationName = TRANSLATIONS[currentTranslationIndex];
    currentTranslationSpan.textContent = translationName; 
    chapterDisplayTitle.textContent = `${currentBook} ${currentChapter}장`;
    textDisplay.innerHTML = ''; 
    footnoteContainer.innerHTML = '';
    
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
        
        generateFootnotes();

    } catch (error) {
        console.error("본문 로딩 오류:", error);
        textDisplay.innerHTML = `<p>'${translationName}' 버전의 본문을 불러오는 중 오류가 발생했습니다.</p><p style="color:red;">${error.message}</p>`;
    }
}

// --- 7. (핵심 수정) 본문 <p> 태그 추가 + 각주 수집 ---
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
            const savedMemo = localStorage.getItem(memoKey);
            if (savedMemo) {
                chapterFootnotes.push({ word: word, text: savedMemo });
                const footnoteNum = chapterFootnotes.length;
                return `<span class="word-memo" data-word="${word}">${match}<sup>[${footnoteNum}]</sup></span>`;
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

// (새 기능) 각주 목록을 HTML로 렌더링
function generateFootnotes() {
    if (chapterFootnotes.length > 0) {
        let html = '';
        chapterFootnotes.forEach((note, index) => {
            const footnoteNum = index + 1;
            html += `
                <div class="footnote-item">
                    <sup>[${footnoteNum}]</sup> 
                    <strong>${note.word}:</strong> 
                    <p>${note.text.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        });
        footnoteContainer.innerHTML = html;
    } else {
        footnoteContainer.innerHTML = '';
    }
}


// --- 8. (수정) 검색 로직 (카테고리 분리) ---
function handleSearch(keyword, type) {
    if (!keyword || keyword.trim() === '') { alert("검색어를 입력해주세요."); return; }
    topSearchInput.value = keyword;
    quickJumpSearchInput.value = keyword;
    topSearchType.value = type;
    quickSearchType.value = type;

    let bibleResults = [];
    let memoResults = [];

    // 1. 성경 검색
    if (type === 'bible' || type === 'integrated') {
        BIBLE_BOOKS.forEach(book => {
            const bookName = book.name;
            const bookData = BIBLE_TEXT_DATA["개역한글"][bookName];
            if (!bookData) return;
            Object.keys(bookData).forEach(chapterKey => {
                const chapterNum = parseInt(chapterKey, 10);
                const versesArray = bookData[chapterKey];
                versesArray.forEach((verseText, verseIndex) => {
                    if (verseText.includes(keyword)) {
                        bibleResults.push({ 
                            type: 'bible',
                            book: bookName,
                            chapter: chapterNum,
                            verse: verseIndex + 1,
                            text: verseText
                        });
                    }
                });
            });
        });
    }
    
    // 2. 메모 검색
    if (type === 'memo' || type === 'integrated') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (value.includes(keyword)) {
                let title = '';
                let book = '';
                let chapter = 0;
                let memoType = '';

                if (key.startsWith('bookmemo_')) {
                    title = key.replace('bookmemo_', '');
                    memoType = '책 메모';
                    book = title;
                } else if (key.startsWith('chapmemo_')) {
                    title = key.replace('chapmemo_', '').replace('_', ' ');
                    memoType = '장 메모';
                    [book, chapter] = title.split(' ');
                    chapter = parseInt(chapter.replace('장', ''));
                } else if (key.startsWith('wordmemo_')) {
                    title = `'${key.replace('wordmemo_', '')}' 단어 메모`;
                    memoType = '단어 메모';
                }
                
                if (memoType) {
                    memoResults.push({
                        type: 'memo',
                        title: title,
                        text: value,
                        memoType: memoType,
                        book: book,
                        chapter: chapter
                    });
                }
            }
        }
    }
    
    displaySearchResults(bibleResults.concat(memoResults), keyword);
}

// (수정) 검색 결과 표시 (메모/성경 구분)
function displaySearchResults(results, keyword) {
    showScreen('search');
    searchResultsList.innerHTML = '';
    searchResultsTitle.textContent = `"${keyword}" 검색 결과 (${results.length}건)`;
    
    if (results.length === 0) {
        searchResultsList.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    const regex = new RegExp(keyword, 'g'); 

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const highlightedText = result.text.replace(regex, `<mark>${keyword}</mark>`);
        
        if (result.type === 'bible') {
            item.innerHTML = `
                <strong>${result.book} ${result.chapter}:${result.verse}</strong>
                <p>${highlightedText}</p>
            `;
            item.onclick = () => {
                const bookData = BIBLE_BOOKS.find(b => b.name === result.book);
                if (bookData) {
                    showChapterText(result.book, result.chapter, bookData.chapters);
                }
            };
        } else if (result.type === 'memo') {
            item.innerHTML = `
                <strong>${result.title}</strong>
                <span class="memo-tag">${result.memoType}</span>
                <p>${highlightedText}</p>
            `;
            if (result.memoType === '책 메모') {
                const bookData = BIBLE_BOOKS.find(b => b.name === result.book);
                if (bookData) {
                    item.onclick = () => showChapterList(result.book, bookData.chapters);
                }
            } else if (result.memoType === '장 메모') {
                 const bookData = BIBLE_BOOKS.find(b => b.name === result.book);
                if (bookData) {
                    item.onclick = () => showChapterText(result.book, result.chapter, bookData.chapters);
                }
            } else { // 단어 메모
                item.onclick = () => openMemoModal(result.title.replace(/'/g, '').replace(' 단어 메모', ''), 'word');
            }
        }
        
        searchResultsList.appendChild(item);
    });
}

// --- 9. 빠른 이동 관련 함수들 (변경 없음) ---
function populateBookDropdown() {
    if (!quickJumpBook) return;
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
function getMemoKey(key, type) {
    if (type === 'word') return `wordmemo_${key}`;
    if (type === 'book') return `bookmemo_${key}`;
    if (type === 'chapter') return `chapmemo_${key.replace(' ', '_')}`;
    return `memo_${key}`;
}
function openMemoModal(key, type, targetElement = null) {
    currentMemoKey = getMemoKey(key, type);
    currentMemoType = type;
    currentMemoTargetElement = targetElement;
    
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
function closeMemoModal() {
    memoModalOverlay.classList.add('hidden');
    currentMemoKey = '';
    currentMemoType = '';
    currentMemoTargetElement = null;
}
function saveMemo() {
    const textToSave = memoTextarea.value;
    
    if (currentMemoKey && textToSave) {
        localStorage.setItem(currentMemoKey, textToSave);
        
        // (단어 메모) 저장 시 '진하게 + 각주' 스타일로 즉시 변경
        if (currentMemoType === 'word') {
            renderChapterText(); // (수정) 각주를 다시 그려야 하므로 본문 전체 새로고침
        }
    } else if (currentMemoKey) {
        deleteMemo(); // 텍스트가 비어있으면 삭제
        return; // closeMemoModal()이 deleteMemo()에서 호출됨
    }
    
    closeMemoModal();
}
function deleteMemo() {
    if (currentMemoKey) {
        localStorage.removeItem(currentMemoKey);
        
        // (단어 메모) 삭제 시 '일반' 스타일로 즉시 복구
        if (currentMemoType === 'word') {
            renderChapterText(); // (수정) 각주를 다시 그려야 하므로 본문 전체 새로고침
        }
    }
    closeMemoModal();
}

// --- 13. (새 기능) '내 메모' 화면 생성 ---
function generateMemosList() {
    memosListContainer.innerHTML = '';
    let hasMemos = false;
    let allMemos = [];

    // 1. localStorage에서 모든 메모 수집
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
            title = key.replace('chapmemo_', '').replace('_', ' ');
            type = '장 메모';
            [book, chapter] = title.split(' ');
            chapter = parseInt(chapter.replace('장', ''));
        } else if (key.startsWith('wordmemo_')) {
            title = `'${key.replace('wordmemo_', '')}' 단어 메모`;
            type = '단어 메모';
        }
        
        if (type) {
            hasMemos = true;
            allMemos.push({ key, title, type, book, chapter, value });
        }
    }
    
    // 2. (수정) 메모를 책/장 순서로 정렬
    allMemos.sort((a, b) => {
        const bookAIndex = BIBLE_BOOKS.findIndex(book => book.name === a.book);
        const bookBIndex = BIBLE_BOOKS.findIndex(book => book.name === b.book);
        
        if (bookAIndex !== bookBIndex) return bookAIndex - bookBIndex; // 책 순서
        if (a.chapter !== b.chapter) return a.chapter - b.chapter; // 장 순서
        return a.title.localeCompare(b.title); // 그 외(단어 등)
    });

    // 3. 정렬된 메모를 HTML로 렌더링
    if (!hasMemos) {
        memosListContainer.innerHTML = '<p>저장된 메모가 없습니다.</p>';
        return;
    }

    allMemos.forEach(memo => {
        const item = document.createElement('div');
        item.className = 'memo-list-item';
        item.innerHTML = `
            <h4>${memo.title} <span>(${memo.type})</span></h4>
            <p>${memo.value.replace(/\n/g, '<br>')}</p>
        `;
        
        if (memo.type === '책 메모') {
            const bookData = BIBLE_BOOKS.find(b => b.name === memo.book);
            if (bookData) {
                item.onclick = () => showChapterList(memo.book, bookData.chapters);
            }
        } else if (memo.type === '장 메모') {
             const bookData = BIBLE_BOOKS.find(b => b.name === memo.book);
            if (bookData) {
                item.onclick = () => showChapterText(memo.book, memo.chapter, bookData.chapters);
            }
        } else { // 단어 메모
            item.onclick = () => openMemoModal(memo.key.replace('wordmemo_', ''), 'word');
        }
        
        memosListContainer.appendChild(item);
    });
}