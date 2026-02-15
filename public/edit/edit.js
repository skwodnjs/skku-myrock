const boardSelect = document.getElementById("board");
const contentRow = document.getElementById("content-row");

boardSelect.addEventListener("change", () => {
  const value = boardSelect.value;

  if (value === "schedule") {
    contentRow.innerHTML = `
      <label for="content" id="content-label">링크</label>
      <input
        type="url"
        id="content-line"
        name="content"
        placeholder="공연 관련 링크 입력"
        required
      />
    `;
  } else {
    contentRow.innerHTML = `
      <label for="content" id="content-label">내용</label>
      <select id="content-format" name="contentFormat" aria-label="내용 형식 선택">
        <option value="plain" selected>일반</option>
        <option value="html">html</option>
        <option value="markdown">마크다운</option>
      </select>
      <textarea
        id="content-area"
        name="content"
        placeholder="내용을 입력하세요"
        required
      ></textarea>
    `;
  }
});
