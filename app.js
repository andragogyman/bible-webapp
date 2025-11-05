// 이 코드는 HTML 문서가 다 준비되면 자동으로 실행됩니다.
window.addEventListener('DOMContentLoaded', () => {
    
    // '창세기 1장 1절'을 화면에 표시합니다.
    displayVerse('창세기', 1, 1);
});

/**
 * BIBLE_TEXT_DATA 변수에서 성경 구절을 찾아 화면에 표시하는 함수
 * @param {string} bookName (예: '창세기')
 * @param {number} chapter (예: 1)
 * @param {number} verse (예: 1)
 */
function displayVerse(bookName, chapter, verse) {
    // 1. HTML에서 성경 본문을 표시할 div 요소를 찾습니다.
    const bibleTextDiv = document.getElementById('bible-text');

    // 2. chapter와 verse는 숫자지만, 데이터의 '키(key)'는 문자열일 수 있습니다.
    const chapterKey = String(chapter); // 숫자를 문자열 "1"로 변환
    const verseIndex = verse - 1;       // 배열은 0부터 시작하므로 1을 뺌

    try {
        // 3. BIBLE_TEXT_DATA에서 본문을 직접 찾습니다.
        //    (데이터 구조: BIBLE_TEXT_DATA["개역한글"]["창세기"]["1"][0])
        const verseText = BIBLE_TEXT_DATA["개역한글"][bookName][chapterKey][verseIndex];

        // 4. 본문을 성공적으로 찾았으면 HTML에 표시합니다.
        if (verseText) {
            bibleTextDiv.innerHTML = `
                <h2>${bookName} ${chapter}장 ${verse}절</h2>
                <p>${verseText}</p>
                <small>(개역한글 - 로컬 파일)</small>
            `;
        } else {
            // 본문은 찾았으나 텍스트가 비어있는 경우
            bibleTextDiv.innerHTML = '해당 절의 텍스트가 비어있습니다.';
        }

    } catch (error) {
        // 5. '개역한글', '창세기', '1장', '1절' 중 하나라도 못 찾으면 오류 발생
        console.error("데이터를 찾는 중 오류 발생:", error);
        bibleTextDiv.innerHTML = `
            <p><strong>'${bookName} ${chapter}장 ${verse}절'</strong>을(를) 찾는 중 오류가 발생했습니다.</p>
            <p>책, 장, 또는 절 번호를 확인해주세요.</p>
        `;
    }
}