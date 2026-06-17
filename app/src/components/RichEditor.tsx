/**
 * RichEditor - 公众号风格富文本编辑器
 *
 * 基于 wangEditor 5.x,UI/UX 仿公众号编辑器:
 * - 顶部 toolbar 工具栏(公众号常见按钮)
 * - 粘贴 HTML 自动保留格式(从公众号/Word/网页粘贴不丢样式)
 * - 暴露 value + onChange,跟 React 受控组件一致
 * - 上传图片/视频走 /api/v1/admin/upload(走项目自己的存储)
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import { DataStore } from '@/data/store';

export interface RichEditorProps {
  /** 受控值(HTML 字符串) */
  value?: string;
  /** 值变化回调 */
  onChange?: (html: string) => void;
  /** 占位文字 */
  placeholder?: string;
  /** 最小高度(px) */
  minHeight?: number;
  /** 禁用 */
  disabled?: boolean;
  /** 编辑器创建后回调(给 onCreated 拿 IDomEditor) */
  onCreated?: (editor: IDomEditor) => void;
}

// 公众号风格 toolbar(用 IMenuGroup 格式分组)
// IMenuGroup 格式: { key, title, iconSvg?, menuKeys: string[] }
const TOOLBAR_KEYS: IToolbarConfig['toolbarKeys'] = [
  {
    key: 'group-style',
    title: '文本格式',
    menuKeys: ['bold', 'underline', 'italic', 'through', 'code', 'sup', 'sub'],
  },
  {
    key: 'group-format',
    title: '字号颜色',
    menuKeys: ['fontSize', 'color', 'bgColor'],
  },
  {
    key: 'group-block',
    title: '排版',
    menuKeys: ['headerSelect', 'indent', 'delIndent', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyJustify'],
  },
  {
    key: 'group-element',
    title: '块级',
    menuKeys: ['blockquote', 'codeBlock', 'divider', 'insertLink', 'emotion'],
  },
  {
    key: 'group-media',
    title: '媒体',
    menuKeys: ['uploadImage', 'uploadVideo'],
  },
  {
    key: 'group-history',
    title: '操作',
    menuKeys: ['undo', 'redo', 'clearAll'],
  },
];

export const RichEditor: React.FC<RichEditorProps> = ({
  value = '',
  onChange,
  placeholder = '请输入内容…',
  minHeight = 400,
  disabled = false,
  onCreated,
}) => {
  // 保留最新 editor 引用(销毁时用)
  const editorRef = useRef<IDomEditor | null>(null);

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = useMemo(() => ({
    placeholder,
    readOnly: disabled,
    // 公众号风格:粘贴保留 HTML 样式
    customPaste: (_editor: IDomEditor, _event: ClipboardEvent) => {
      // 返回 false 让 wangEditor 走默认粘贴(保留 HTML 标签和 inline style)
      return false;
    },
    // 自动把 http:// 链接识别为链接
    autoConvertProtocol: true,
    // 上传配置
    MENU_CONF: {
      uploadImage: {
        // wangEditor 5:customUpload 接收 file,返回 url
        customUpload: async (file: File, insertFn: (url: string) => void) => {
          try {
            const url = await DataStore.uploadFile(file, 'news');
            insertFn(url);
          } catch (e: any) {
            alert('图片上传失败: ' + (e?.message || e));
          }
        },
      },
      uploadVideo: {
        customUpload: async (file: File, insertFn: (url: string) => void) => {
          try {
            const url = await DataStore.uploadFile(file, 'news');
            insertFn(url);
          } catch (e: any) {
            alert('视频上传失败: ' + (e?.message || e));
          }
        },
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [placeholder, disabled]);

  // toolbar 配置
  const toolbarConfig: IToolbarConfig = useMemo(() => ({
    toolbarKeys: TOOLBAR_KEYS,
    insertKeys: { index: 0, keys: [] },
    excludeKeys: [],
    modalAppendToBody: false,
  }), []);

  // 销毁
  useEffect(() => {
    return () => {
      const e = editorRef.current;
      if (e) {
        try { e.destroy(); } catch {}
      }
    };
  }, []);

  return (
    <div
      className="rich-editor-wrapper border border-gray-200 rounded-lg overflow-hidden bg-white"
      style={{ minHeight: minHeight + 50 }}
    >
      <Toolbar
        editor={editorRef.current}
        defaultConfig={toolbarConfig}
        mode="default"
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={(e) => {
          editorRef.current = e;
          onCreated?.(e);
        }}
        onChange={(e) => onChange?.(e.getHtml())}
        mode="default"
        style={{ minHeight }}
      />
    </div>
  );
};
