'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './TipTapEditor.module.css';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  serverID?: string;
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  serverID,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!editor || !file) return;

    try {
      // 이미지를 base64로 변환
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // data:image/... 부분 제거

        try {
          // 이미지 업로드 API 호출
          const result = await SammoAPI.MiscUploadImage({
            imageData: base64Data,
            session_id: serverID || 'sangokushi_default',
          } as any);

          if (result.result && result.path) {
            // 이미지 URL을 에디터에 삽입
            editor.chain().focus().setImage({ src: result.path }).run();
          } else {
            alert(result.reason || '이미지 업로드에 실패했습니다.');
          }
        } catch (error: any) {
          console.error('Image upload error:', error);
          alert('이미지 업로드 중 오류가 발생했습니다.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Image upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleImageButtonClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    };
    input.click();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.active : ''}`}
          title="굵게"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.active : ''}`}
          title="기울임"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${styles.toolbarButton} ${editor.isActive('strike') ? styles.active : ''}`}
          title="취소선"
        >
          <s>S</s>
        </button>
        <div className={styles.toolbarDivider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 1 }) ? styles.active : ''}`}
          title="제목 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
          title="제목 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
          title="제목 3"
        >
          H3
        </button>
        <div className={styles.toolbarDivider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.active : ''}`}
          title="목록"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.active : ''}`}
          title="번호 목록"
        >
          1.
        </button>
        <div className={styles.toolbarDivider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${styles.toolbarButton} ${editor.isActive('blockquote') ? styles.active : ''}`}
          title="인용"
        >
          &quot;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={styles.toolbarButton}
          title="구분선"
        >
          ─
        </button>
        <div className={styles.toolbarDivider} />
        <button
          type="button"
          onClick={handleImageButtonClick}
          className={styles.toolbarButton}
          title="이미지 삽입"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={styles.toolbarButton}
          disabled={!editor.can().undo()}
          title="실행 취소"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={styles.toolbarButton}
          disabled={!editor.can().redo()}
          title="다시 실행"
        >
          ↷
        </button>
      </div>
      <EditorContent editor={editor} className={styles.editorWrapper} />
    </div>
  );
}

