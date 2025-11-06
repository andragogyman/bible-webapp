// --- 1. 전역 변수 ---
let bookScreen, chapterScreen, textScreen, searchResultsScreen, memosScreen;
let bookGridOt, bookGridNt;
let chapterGrid, textDisplay, footnoteContainer;
let chapterSelectionTitle, chapterDisplayTitle;
let backToBookListBtn, backToChapterListBtn;
let toggleLeftBtn, toggleRightBtn, currentTranslationSpan;
let chapterScroller;
let quickJumpBook, quickJumpChapter, quickJumpGo;
let topSearchInput, topSearchButton, topSearchType;
let quickJumpSearchInput, quickJumpSearchGo, quickSearchType;
let searchResultsList, searchResultsTitle;
let backFromSearchBtn, backFromMemosBtn;
let lastActiveScreen = 'book';
let selectionControls, selectionCountSpan, copyButton, selectAllButton, deselectAllButton;
let selectedVerses = new Set();
const TRANSLATIONS = ["개역한글", "개역한글(한자)"];
let currentTranslationIndex = 0; 
let currentBook = '';
let currentChapter = 0;
let currentChapterCount = 0;

let themeToggles = [];
let homeButtons = []; 

let memoModalOverlay, memoModal, memoWordTitle, memoTextarea;
let memoSaveButton, memoCloseButton, memoDeleteButton;
let currentMemoKey = ''; // 예: versememo_창세기_1_1
let currentMemoType = ''; // 'book', 'chapter', 'verse_selection'
let currentSelectedPhrase = ''; // (신규) 드래그로 선택한 텍스트
let currentPhraseStartIndex = -1; // (신규) 드래그로 선택한 구간의 시작 인덱스

let myMemosButton, memosListContainer;
let bookMemoButton, chapterMemoButton;

let chapterFootnotes = [];

// --- 2. 앱 초기화 ---
window.addEventListener('DOMContentLoaded', () => {
    
    // 2-1. (중요!) 모든 HTML 요소를 찾고, 실패 시 즉시 오류 보고
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
        homeButtons = document.querySelectorAll('.home-button');

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
        if (!bookScreen || !chapterGrid || !memoModalOverlay || !themeToggles.length || !myMemosButton || !bookMemoButton || !chapterMemoButton || !footnoteContainer || !topSearchType || !homeButtons.length || !document.getElementById('bottom-controls-container')) {
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

    // 2-3. (수정) '드래그' 및 '한자' 클릭 리스너
    textDisplay.addEventListener('mouseup', handleTextSelection); // 드래그(선택)
    textDisplay.addEventListener('click', handleTextClick); // 한자어, 메모된 단어 클릭

    // 2-4. 테마 스위치 로직
    const currentTheme = localStorage.getItem('bible-theme') || 'dark';
    setTheme(currentTheme);
    themeToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const newTheme = toggle.checked ? 'dark' : 'light';
            setTheme(newTheme);
            localStorage.setItem('bible-theme', newTheme);
        });
    });
    
    // 2-5. 홈 버튼 리스너
    homeButtons.forEach(button => {
        button.addEventListener('click', () => showScreen('book'));
    });

    // 2-6. 메모 모달 버튼 리스너
    memoSaveButton.addEventListener('click', saveMemo);
    memoCloseButton.addEventListener('click', closeMemoModal);
    memoDeleteButton.addEventListener('click', deleteMemo);
    memoModalOverlay.addEventListener('click', (e) => {
        if (e.target === memoModalOverlay) closeMemoModal();
    });
    
    // 2-7. '내 메모' 및 책/장 메모 버튼 리스너
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
    quickSearchType.addEventListener('change', () => topSearchType.value = topSearchType.value);
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

// --- 테마 설정 헬퍼 ---
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggles.forEach(toggle => toggle.checked = true);
    } else {
        document.body.classList.remove('dark-mode');
        themeToggles.forEach(toggle => toggle.checked = false);
    }
}


// --- (수정) 화면 전환 관리 (하단 바 제어) ---
function showScreen(screenName) {
    bookScreen.classList.add('hidden');
    chapterScreen.classList.add('hidden');
    textScreen.classList.add('hidden');
    searchResultsScreen.classList.add('hidden');
    memosScreen.classList.add('hidden');
    
    // (추가) 하단 고정 메뉴 제어
    const bottomControls = document.getElementById('bottom-controls-container');
    if (screenName === 'text') {
        bottomControls.classList.remove('hidden');
    } else {
        bottomControls.classList.add('hidden');
    }

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
    clearAllSelections(); // (중요) 화면 전환 직후 선택 해제
    currentBook = bookName;
    currentChapter = chapterNum;
    currentChapterCount = chapterCount;
    
    backToChapterListBtn.onclick = () => showChapterList(currentBook, currentChapterCount);
    
    chapterMemoButton.onclick = () => openMemoModal(`${currentBook} ${currentChapter}장`, 'chapter');
    
    renderChapterText();
    generateChapterScroller();
    updateDropdowns();
}

// --- 6. (수정) 본문 렌더링 + 각주 생성 ---
function renderChapterText() {
    clearAllSelections();
    chapterFootnotes = []; // (중요) 각주 목록을 여기서 초기화
    
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
        
        generateFootnotes(); // 모든 절 순회가 끝난 후, 각주 목록을 생성

    } catch (error) {
        console.error("본문 로딩 오류:", error);
        textDisplay.innerHTML = `<p>'${translationName}' 버전의 본문을 불러오는 중 오류가 발생했습니다.</p><p style="color:red;">${error.message}</p>`;
    }
}

// --- 7. (핵심 수정) 본문 <p> 태그 추가 (DOM 분할 방식) ---
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

    const translationName = TRANSLATIONS[currentTranslationIndex];
    const textSpan = document.createElement('span');
    textSpan.className = 'verse-text-content';

    // ' ' + verseText로 텍스트 노드 생성
    const mainTextNode = document.createTextNode(" " + verseText);
    textSpan.appendChild(mainTextNode);
    
    if (translationName === "개역한글") {
        // 위치(startIndex) 기반으로 메모 적용
        const verseMemoKey = getMemoKey(verseId, 'verse_selection');
        const allMemos = JSON.parse(localStorage.getItem(verseMemoKey) || '[]');
        
        // ******** (핵심 수정) ********
        // 'startIndex'가 있는, 유효한 새 형식의 메모만 필터링합니다.
        // 'startIndex'가 없는 오래된 형식의 메모는 (위치가 부정확하므로) *무시*합니다.
        const validMemos = allMemos.filter(memo => typeof memo.startIndex === 'number');
        
        // 1. 각주 목록 생성 (오름차순) - 'validMemos' 사용
        const memosAsc = [...validMemos].sort((a, b) => a.startIndex - b.startIndex);
        const footnoteMap = new Map(); // {startIndex_phrase: footnoteNum}
        
        memosAsc.forEach(memo => {
            // (수정) 전역 각주 배열에 추가
            chapterFootnotes.push({ word: memo.phrase, text: memo.memo });
            // (수정) 현재 각주 번호는 '전체' 배열의 길이
            const footnoteNum = chapterFootnotes.length; 
            footnoteMap.set(`${memo.startIndex}_${memo.phrase}`, footnoteNum);
        });

        // 2. DOM 삽입 (내림차순 - 인덱스 꼬임 방지) - 'validMemos' 사용
        const memosDesc = [...validMemos].sort((a, b) => b.startIndex - a.startIndex);
        
        memosDesc.forEach(memo => {
            const startIndex = memo.startIndex;
            const phrase = memo.phrase;
            const endIndex = startIndex + phrase.length;
            
            let currentOffset = 0;
            let targetNode = null;
            
            for (const node of textSpan.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const nodeLength = node.textContent.length;
                    if (currentOffset <= startIndex && (currentOffset + nodeLength) >= endIndex) {
                        targetNode = node;
                        break;
                    }
                    currentOffset += nodeLength;
                } else {
                    currentOffset += node.textContent.length;
                }
            }
            
            if (targetNode) {
                const internalStart = startIndex - currentOffset;
                const internalEnd = endIndex - currentOffset;

                const text = targetNode.textContent;
                const before = text.substring(0, internalStart);
                const highlighted = text.substring(internalStart, internalEnd);
                const after = text.substring(internalEnd);
                
                // 4. 맵에서 각주 번호 조회
                const footnoteNum = footnoteMap.get(`${memo.startIndex}_${memo.phrase}`);
                if (!footnoteNum) {
                    console.warn("Footnote-Key not found:", `${memo.startIndex}_${memo.phrase}`);
                    return; // forEach에서 continue 대신 return
                }

                // 5. <span> 태그 생성
                const span = document.createElement('span');
                span.className = 'word-memo';
                span.dataset.phrase = phrase;
                span.dataset.startIndex = startIndex; // 클릭 시 사용
                span.innerHTML = `${highlighted}<sup>[${footnoteNum}]</sup>`;
                
                // 6. DOM 재조립 (원본 노드 교체)
                const parent = targetNode.parentNode;
                if (after.length > 0) parent.insertBefore(document.createTextNode(after), targetNode.nextSibling);
                parent.insertBefore(span, targetNode.nextSibling);
                if (before.length > 0) parent.insertBefore(document.createTextNode(before), span);
                parent.removeChild(targetNode);
            }
        });

    } else if (translationName === "개역한글(한자)") {
        // (수정) innerHTML 대신 DOM 노드 생성
        textSpan.innerHTML = ''; // 기존 텍스트 노드 제거
        
        const hanjaRegex = /([\u4E00-\u9FFF]+)/g;
        const text = " " + verseText;
        const parts = text.split(hanjaRegex);
        
        parts.forEach(part => {
            if (part.match(hanjaRegex)) {
                const span = document.createElement('span');
                span.className = 'word-hanja';
                span.dataset.word = part;
                span.textContent = part;
                textSpan.appendChild(span);
            } else {
                textSpan.appendChild(document.createTextNode(part));
            }
        });
    }

    p.appendChild(textSpan);
    textDisplay.appendChild(p);
}


// (새 기능) 각주 목록을 HTML로 렌더링
function generateFootnotes() {
    if (chapterFootnotes.length > 0) {
        let html = '';
        // (수정) 전역 배열인 chapterFootnotes를 처음부터 끝까지 순회
        chapterFootnotes.forEach((note, index) => {
            const footnoteNum = index + 1; // 0번부터 시작하므로 +1
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
            
            let memoContent = value;
            let foundInMemo = false;

            if (key.startsWith('versememo_')) {
                // '절 귀속' 메모 (JSON 배열)
                try {
                    const memos = JSON.parse(value);
                    foundInMemo = memos.some(memo => memo.memo.includes(keyword) || memo.phrase.includes(keyword));
                    memoContent = memos.map(m => `${m.phrase}: ${m.memo}`).join('\n');
                } catch(e) {}
            } else {
                // 책/장 메모 (일반 텍스트)
                foundInMemo = value.includes(keyword);
            }
            
            if (foundInMemo) {
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
                } else if (key.startsWith('versememo_')) {
                    const parts = key.split('_');
                    book = parts[1];
                    chapter = parseInt(parts[2], 10);
                    title = `${book} ${chapter}장 구간 메모`;
                    memoType = '구간 메모';
                }
                
                if (memoType) {
                    memoResults.push({
                        type: 'memo',
                        title: title,
                        text: memoContent,
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
            const bookData = BIBLE_BOOKS.find(b => b.name === result.book);
            if (bookData) {
                item.onclick = () => showChapterText(result.book, result.chapter, bookData.chapters);
            }
        } else if (result.type === 'memo') {
            item.innerHTML = `
                <strong>${result.title}</strong>
                <span class="memo-tag">${result.memoType}</span>
                <p>${highlightedText.replace(/\n/g, '<br>')}</p>
            `;
            const bookData = BIBLE_BOOKS.find(b => b.name === result.book);
            if (bookData) {
                if (result.memoType === '책 메모') {
                    item.onclick = () => showChapterList(result.book, bookData.chapters);
                } else { // 장 메모, 구간 메모
                    item.onclick = () => showChapterText(result.book, result.chapter, bookData.chapters);
                }
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

// --- 10. 구절 선택/복사 관련 함수들 ---
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

// (수정) 하단 바 제어 추가
function updateSelectionControls() {
    const count = selectedVerses.size;
    const bottomControls = document.getElementById('bottom-controls-container');
    
    if (count > 0) {
        selectionCountSpan.textContent = `${count}개 구절 선택됨`;
        selectionControls.classList.remove('hidden');
        bottomControls.classList.add('hidden'); // (추가) 하단 메뉴 숨기기
    } else {
        selectionControls.classList.add('hidden');
        bottomControls.classList.remove('hidden'); // (추가) 하단 메뉴 보이기
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
        const textSpan = pElement.querySelector('span.verse-text-content');
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

// --- 11. (수정) 드래그 선택 / 클릭 (위치 기반) ---
function handleTextClick(event) {
    const target = event.target; 
    
    // (기존) '한자' 버전의 한자 단어 클릭 시 (사전)
    if (target.classList.contains('word-hanja')) {
        const word = target.dataset.word;
        const url = `https://hanja.dict.naver.com/#/search?query=${encodeURIComponent(word)}`;
        window.open(url, '_blank');
    }
    
    // (수정) '메모된 구간' 클릭 시 (closest 사용)
    const memoSpan = target.closest('.word-memo');
    if (memoSpan) {
        const phrase = memoSpan.dataset.phrase;
        const startIndex = parseInt(memoSpan.dataset.startIndex, 10);
        const verseId = memoSpan.closest('p.verse').dataset.verseId;
        
        // (중요) 모달 열기 전, 현재 정보 설정
        currentPhraseStartIndex = startIndex;
        openMemoModal(phrase, 'verse_selection', verseId);
    }
}

// (수정) 마우스 드래그(선택) 끝났을 때 (startIndex 계산)
function handleTextSelection() {
    // '개역한글' 버전일 때만 작동
    if (TRANSLATIONS[currentTranslationIndex] !== "개역한글") return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // 1. 선택된 텍스트가 있고, 구절 복사 모드가 아닐 때
    if (selectedText.length > 0 && selectedVerses.size === 0) {
        const range = selection.getRangeAt(0);
        
        // 2. 선택이 <span class="verse-text-content"> 안에서 일어났는지 확인
        const parentVerse = range.startContainer.parentElement.closest('p.verse');
        const textContentSpan = range.startContainer.parentElement.closest('span.verse-text-content');

        if (parentVerse && textContentSpan) {
            // 3. verse-text-content 내의 시작 위치(offset) 계산
            let charOffset = 0;
            let found = false;
            
            // textContentSpan의 모든 자식 노드(텍스트 노드, <span> 노드 등)를 순회
            for (const node of textContentSpan.childNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && node.contains(range.startContainer)) {
                    // 이미 메모된 <span> 안의 텍스트 노드를 선택한 경우
                    // 여기서는 새 메모 작성을 막습니다. (기존 메모는 handleTextClick에서 처리)
                    window.getSelection().removeAllRanges();
                    return;
                }
                
                if (node === range.startContainer) { // 시작 노드(텍스트 노드)를 찾음
                    charOffset += range.startOffset;
                    found = true;
                    break;
                }
                
                charOffset += node.textContent.length;
            }
            
            if (found) {
                const verseId = parentVerse.dataset.verseId;
                // (중요) 전역 변수에 시작 위치 저장
                currentPhraseStartIndex = charOffset; 
                openMemoModal(selectedText, 'verse_selection', verseId);
            }
        }
    }
}

// --- 12. (수정) 범용 메모 관련 함수들 (startIndex 기반) ---
function getMemoKey(key, type) {
    if (type === 'book') return `bookmemo_${key}`;
    if (type === 'chapter') return `chapmemo_${key.replace(' ', '_')}`;
    if (type === 'verse_selection') return `versememo_${key}`; // 예: versememo_창세기_1_1
    return `memo_${key}`;
}

function openMemoModal(key, type, verseId = '') {
    // 'key'는 책, 장, 또는 선택된 '구간' 텍스트
    currentMemoType = type;
    
    let memoText = '';
    
    if (type === 'verse_selection') {
        currentMemoKey = getMemoKey(verseId, type); // 키는 '창세기_1_1'
        currentSelectedPhrase = key; // 선택된 '구간'
        // currentPhraseStartIndex는 handleTextSelection 또는 handleTextClick에서 이미 설정됨
        
        memoWordTitle.textContent = `'${key}' 구간 메모`;
        
        // (수정) 기존 메모 찾기 (startIndex 포함)
        const memos = JSON.parse(localStorage.getItem(currentMemoKey) || '[]');
        const existingMemo = memos.find(m => m.phrase === currentSelectedPhrase && m.startIndex === currentPhraseStartIndex);
        
        if(existingMemo) memoText = existingMemo.memo;
        
    } else { // 책 또는 장 메모
        currentMemoKey = getMemoKey(key, type);
        currentSelectedPhrase = '';
        currentPhraseStartIndex = -1; // (초기화)
        memoWordTitle.textContent = `'${key}' 메모`;
        memoText = localStorage.getItem(currentMemoKey) || '';
    }
    
    if (memoText) {
        memoTextarea.value = memoText;
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
    currentSelectedPhrase = '';
    currentPhraseStartIndex = -1; // (초기화)
    
    // (중요) 드래그 선택 해제
    window.getSelection().removeAllRanges();
}

function saveMemo() {
    const textToSave = memoTextarea.value;
    
    if (!currentMemoKey) return;
    
    if (currentMemoType === 'verse_selection') {
        // (수정) '절 귀속' 구간 메모 저장 (startIndex 포함)
        const memos = JSON.parse(localStorage.getItem(currentMemoKey) || '[]');
        
        // (수정) 이 '구간' + '위치'에 대한 메모가 이미 있는지 확인
        const existingMemoIndex = memos.findIndex(m => m.phrase === currentSelectedPhrase && m.startIndex === currentPhraseStartIndex);
        
        if (textToSave) {
            // 저장 또는 수정
            if (existingMemoIndex > -1) {
                memos[existingMemoIndex].memo = textToSave;
            } else {
                // (수정) startIndex 저장
                memos.push({ phrase: currentSelectedPhrase, memo: textToSave, startIndex: currentPhraseStartIndex });
            }
        } else if (existingMemoIndex > -1) {
            // 텍스트가 비어있으면 삭제
            memos.splice(existingMemoIndex, 1);
        }
        
        if (memos.length > 0) {
            localStorage.setItem(currentMemoKey, JSON.stringify(memos));
        } else {
            localStorage.removeItem(currentMemoKey); // 배열이 비면 키 자체를 삭제
        }
        
    } else {
        // (기존) 책/장 메모 저장 (단순 텍스트)
        if (textToSave) {
            localStorage.setItem(currentMemoKey, textToSave);
        } else {
            localStorage.removeItem(currentMemoKey);
        }
    }
    
    if (currentMemoType === 'verse_selection') {
        renderChapterText(); // 본문 전체 새로고침 (각주 업데이트)
    }
    closeMemoModal();
}

function deleteMemo() {
    if (!currentMemoKey) return;

    if (currentMemoType === 'verse_selection') {
        // (수정) '절 귀속' 구간 메모 배열에서 해당 '구간' + '위치'만 삭제
        const memos = JSON.parse(localStorage.getItem(currentMemoKey) || '[]');
        const filteredMemos = memos.filter(m => !(m.phrase === currentSelectedPhrase && m.startIndex === currentPhraseStartIndex));
        
        if (filteredMemos.length > 0) {
            localStorage.setItem(currentMemoKey, JSON.stringify(filteredMemos));
        } else {
            localStorage.removeItem(currentMemoKey); // 배열이 비면 키 자체를 삭제
        }
        renderChapterText(); // 본문 전체 새로고침
    } else {
        // 책/장 메모 삭제
        localStorage.removeItem(currentMemoKey);
    }
    
    closeMemoModal();
}

// --- 13. '내 메모' 화면 생성 ---
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
            allMemos.push({ key, title, type, book, chapter, value });
            hasMemos = true;
        } else if (key.startsWith('chapmemo_')) {
            title = key.replace('chapmemo_', '').replace('_', ' ');
            type = '장 메모';
            [book, chapter] = title.split(' ');
            chapter = parseInt(chapter.replace('장', ''));
            allMemos.push({ key, title, type, book, chapter, value });
            hasMemos = true;
        } else if (key.startsWith('versememo_')) {
            // (수정 없음) '절 귀속' 메모 (JSON 배열)
            // (startIndex는 목록에 표시할 필요 없음)
            const parts = key.split('_'); // versememo_창세기_1
            book = parts[1];
            chapter = parseInt(parts[2], 10);
            
            try {
                const memos = JSON.parse(value);
                memos.forEach(memo => {
                    title = `'${memo.phrase}'`;
                    type = `${book} ${chapter}장`;
                    allMemos.push({ key: key, title: title, type: type, book: book, chapter: chapter, value: memo.memo, phrase: memo.phrase });
                    hasMemos = true;
                });
            } catch(e) {}
        }
    }
    
    // 2. (수정) 메모를 책/장 순서로 정렬
    allMemos.sort((a, b) => {
        const bookAIndex = BIBLE_BOOKS.findIndex(book => book.name === a.book);
        const bookBIndex = BIBLE_BOOKS.findIndex(book => book.name === b.book);
        
        if (bookAIndex !== bookBIndex) return bookAIndex - bookBIndex;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.title.localeCompare(b.title);
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
        
        const bookData = BIBLE_BOOKS.find(b => b.name === memo.book);
        if (bookData) {
            if (memo.type === '책 메모') {
                item.onclick = () => showChapterList(memo.book, bookData.chapters);
            } else { // 장 메모, 구간 메모
                item.onclick = () => showChapterText(memo.book, memo.chapter, bookData.chapters);
            }
        }
        
        memosListContainer.appendChild(item);
    });
}