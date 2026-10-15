import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react';
import type { NoticeCategory } from './noticesData';

type DraftBlock = { id: number; kind: 'text'; text: string } | { id: number; kind: 'image'; url: string; name: string };
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export default function NoticeComposer({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('공지');
  const [blocks, setBlocks] = useState<DraftBlock[]>([{ id: 1, kind: 'text', text: '' }]);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const nextId = useRef(2);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => () => { objectUrls.current.forEach(url => URL.revokeObjectURL(url)); }, []);

  function addText() {
    setBlocks(previous => [...previous, { id: nextId.current++, kind: 'text', text: '' }]);
    setPreview(false);
  }
  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const invalid = selected.find(file => !allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024);
    if (invalid) {
      setError('PNG, JPG, WebP, GIF 형식의 10MB 이하 이미지만 추가할 수 있습니다.');
      event.target.value = '';
      return;
    }
    const newImages: DraftBlock[] = selected.map(file => {
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      return { id: nextId.current++, kind: 'image', url, name: file.name };
    });
    setBlocks(previous => [...previous, ...newImages]);
    setError('');
    setPreview(false);
    event.target.value = '';
  }
  function changeText(id: number, text: string) {
    setBlocks(previous => previous.map(block => block.id === id && block.kind === 'text' ? { ...block, text } : block));
  }
  function moveBlock(index: number, offset: number) {
    setBlocks(previous => {
      const to = index + offset;
      if (to < 0 || to >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }
  function removeBlock(id: number) {
    setBlocks(previous => previous.filter(block => block.id !== id));
  }
  function back() {
    if ((title.trim() || blocks.some(block => block.kind === 'image' || block.text.trim())) &&
        !window.confirm('현재 작성 중인 글은 저장되지 않습니다. 목록으로 돌아갈까요?')) return;
    onBack();
  }

  return <>
    <div className="page-heading container"><span className="eyebrow">NOTICE EDITOR</span>
      <h1>공지사항 글쓰기</h1><p>글을 작성하고 이미지 위치를 조정할 수 있습니다.</p>
    </div>
    <section className="container section-block notice-composer-page">
      <button type="button" className="notice-detail-back" onClick={back}><ArrowLeft size={16}/> 공지사항 목록</button>
      <div className="notice-composer-info" role="note">현재는 작성 및 미리보기만 지원합니다. 게시글은 저장되지 않습니다. 페이지를 나가면 작성한 내용과 이미지는 사라집니다.</div>
      <div className="notice-composer-fields">
        <label>분류
          <select value={category} onChange={event => setCategory(event.target.value as NoticeCategory)}>
            <option value="공지">공지</option><option value="공연">공연</option><option value="행사">행사</option>
          </select>
        </label>
        <label>제목
          <input value={title} maxLength={150} placeholder="공지사항 제목을 입력하세요" onChange={event => setTitle(event.target.value)}/>
        </label>
      </div>
      <div className="notice-composer-top"><h2>본문</h2><p>글과 이미지를 원하는 순서로 배치하세요. 글자 크기 등의 서식 편집은 지원하지 않습니다.</p></div>
      {preview ? <div className="notice-composer-preview" aria-label="게시글 미리보기">
        <span className="notice-detail-category">{category}</span>
        <h3>{title.trim() || '제목 없음'}</h3>
        {blocks.map(block => block.kind === 'text'
          ? <p key={block.id}>{block.text || ' '}</p>
          : <img key={block.id} src={block.url} alt={block.name}/>)}
      </div> : <div className="notice-composer-blocks">
        {blocks.map((block, index) => <div key={block.id} className="notice-composer-block">
          <div className="notice-composer-block-top">
            <strong>{block.kind === 'text' ? '텍스트' : '이미지'} {index + 1}</strong>
            <div className="notice-composer-block-actions">
              <button type="button" aria-label={'블록 ' + (index + 1) + ' 위로 이동'} disabled={index === 0} onClick={() => moveBlock(index, -1)}><ArrowUp size={15}/></button>
              <button type="button" aria-label={'블록 ' + (index + 1) + ' 아래로 이동'} disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}><ArrowDown size={15}/></button>
              <button type="button" aria-label={'블록 ' + (index + 1) + ' 삭제'} onClick={() => removeBlock(block.id)}><Trash2 size={15}/></button>
            </div>
          </div>
          {block.kind === 'text' ?
            <textarea aria-label={'본문 텍스트 ' + (index + 1)} value={block.text} rows={5} placeholder="내용을 입력하세요."
              onChange={event => changeText(block.id, event.target.value)}/> :
            <div className="notice-composer-image"><img src={block.url} alt={block.name}/><small>{block.name}</small></div>}
        </div>)}
      </div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="notice-composer-actions">
        <button type="button" className="outline-action" onClick={addText}><Plus size={15}/> 본문 추가</button>
        <label className="outline-action notice-composer-file">
          <ImagePlus size={15}/> 이미지 추가
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={addImages} aria-label="본문 이미지 선택"/>
        </label>
        <button type="button" className="button button-primary" onClick={() => setPreview(previous => !previous)}>{preview ? '편집으로 돌아가기' : '미리보기'}</button>
      </div>
      <p className="notice-composer-footnote">이미지는 브라우저에서만 미리 표시됩니다. 실제 게시 및 파일 업로드 기능은 추후 연결될 예정입니다.</p>
    </section>
  </>;
}
