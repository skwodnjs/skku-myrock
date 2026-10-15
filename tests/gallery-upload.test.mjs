import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const gallery = await readFile(new URL('../src/PhotoGallery.tsx', import.meta.url), 'utf8');
const dialog = await readFile(new URL('../src/GalleryUploadDialog.tsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('register action is shown only when Firebase login and part-leader-or-higher profile are resolved', () => {
  assert.match(app, /<Gallery canRegister=\{Boolean\(user && !authPending && currentLevel\)\} \/>/);
  assert.match(gallery, /\{canRegister && <button type="button" className="admin-only-action"/);
  assert.match(gallery, /onClick=\{\(\) => setUploadOpen\(true\)\}/);
  assert.match(gallery, /\{canRegister && uploadOpen && <GalleryUploadDialog onClose=/);
  assert.doesNotMatch(gallery, /onRegister/);
});

test('gallery upload uses a focused, scroll-locked overlay with category, title and accessible file dropzone', () => {
  assert.match(dialog, /role="dialog" aria-modal="true"/);
  assert.match(dialog, /aria-labelledby="gallery-upload-title"/);
  assert.match(dialog, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(dialog, /previousFocus\?\.focus\(\)/);
  assert.match(dialog, /event\.key === 'Escape'/);
  assert.match(dialog, /event\.key === 'Tab'/);
  assert.match(dialog, /onMouseDown=\{event =>/);
  assert.match(dialog, /categoryOptions: PhotoCategory\[\] = \['공연', '행사', '일상'\]/);
  assert.match(dialog, /maxLength=\{150\}/);
  assert.match(dialog, /type="file" multiple accept="image\/jpeg,image\/png,image\/webp,image\/gif"/);
  assert.match(dialog, /onDragEnter=\{onAreaDragEnter\}/);
  assert.match(dialog, /onDrop=\{onAreaDrop\}/);
  assert.match(dialog, /onClick=\{\(\) => inputRef\.current\?\.click\(\)\}/);
});

test('selected photos support thumbnails, cover ordering, drag reordering and deletion with URL cleanup', () => {
  assert.match(dialog, /URL\.createObjectURL\(file\)/);
  assert.match(dialog, /urls\.current\.forEach\(url => URL\.revokeObjectURL\(url\)\)/);
  assert.match(dialog, /function removePhoto\(id: number\)/);
  assert.match(dialog, /function movePhoto\(id: number, offset: number\)/);
  assert.match(dialog, /function dropPhoto\(targetId: number\)/);
  assert.match(dialog, /draggable onDragStart=\{event =>/);
  assert.match(dialog, /onDrop=\{event => \{ event\.preventDefault\(\); event\.stopPropagation\(\); dropPhoto\(photo\.id\); \}\}/);
  assert.match(dialog, /onClick=\{\(\) => movePhoto\(photo\.id, -1\)\}/);
  assert.match(dialog, /onClick=\{\(\) => removePhoto\(photo\.id\)\}/);
  assert.match(dialog, /index === 0 \? '대표사진 · 01'/);
});

test('preserve original-image warning and clearly distinguish unimplemented permanent storage', () => {
  assert.match(dialog, /이미지를 저장할 때 자동으로 압축·크기 조정할 수 있습니다/);
  assert.match(dialog, /원본 사진을 별도로 보관해 주세요/);
  assert.match(dialog, /실제 이미지 압축 및 서버 저장은 저장 방식 결정 후 연결할 예정입니다/);
  assert.match(dialog, /사진 등록 \(준비 중\)<\/button>/);
  assert.match(styles, /\.gallery-upload-backdrop\{position:fixed;inset:0/);
  assert.match(styles, /\.gallery-upload-dropzone\{[^}]*border:2px dashed/s);
  assert.match(styles, /\.gallery-upload-hint\{[^}]*font-size:11px;line-height:1\.8/);
  assert.match(styles, /@media\(max-width:680px\)\{/);
});
