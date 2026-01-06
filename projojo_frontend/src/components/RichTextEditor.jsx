import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { marked } from 'marked';
import { useEffect, useRef, useState } from 'react';
import TurndownService from 'turndown';
import { preprocessMarkdown } from '../services';
import Alert from './Alert';
import Modal from './Modal';
import RichTextEditorButton from './RichTextEditorButton';

export default function RichTextEditor({ onSave, error = '', defaultText = '', required = false, label, max = 4000, className, setCanSubmit = () => { } }) {
    const editorRef = useRef(null);
    const [charCount, setCharCount] = useState(defaultText.length);
    const [internalError, setInternalError] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [urlError, setUrlError] = useState('');

    useEffect(() => {
        setInternalError(error);
    }, [error]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link
        ],
        content: marked(preprocessMarkdown(defaultText)),
    });

    const handleSave = async () => {
        if (!editor) return;

        const turndownService = new TurndownService();
        turndownService.addRule('heading1', {
            filter: 'h1',
            replacement: (content) => `# ${content}`,
        });

        turndownService.addRule('heading2', {
            filter: 'h2',
            replacement: (content) => `## ${content}`,
        });

        // fix strike and underline
        turndownService.addRule('strike', {
            filter: ['del', 's', 'strike'],
            replacement: (content) => `~~${content}~~`,
        });

        turndownService.addRule('underline', {
            filter: 'u',
            replacement: (content) => `__${content}__`,
        });

        const content = editor.getHTML();
        const markdownContent = turndownService.turndown(content);

        if (editor.getText().length > max) {
            setInternalError('Je tekst is te lang.');
            setCanSubmit(false);
        } else {
            setInternalError('');
            setCanSubmit(true);
        }
        onSave(markdownContent);
    };

    const isLinkValid = link => {
        // Regular expression for URL validation
        // Source: https://www.freecodecamp.org/news/how-to-write-a-regular-expression-for-a-url/
        // Edited to require http(s)://
        const urlPattern = /^(https?:\/\/)[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?/;
        return urlPattern.test(link);
    }

    const handleLinkInsert = e => {
        e.preventDefault();
        if (!isLinkValid(`https://${linkUrl}`)) {
            return;
        }
        editor.commands.toggleLink({ href: `https://${linkUrl}` });
        setIsLinkModalOpen(false);
        setLinkUrl('');
    };

    const changeLinkUrl = e => {
        let newUrl = e.target.value;

        newUrl = newUrl.trim()
            .replace(/^https?:\/\/(.+)/g, '$1') // Removes http(s)://

        if (newUrl.length === 0) {
            setUrlError('');
            setLinkUrl('');
            return;
        }

        if (!isLinkValid(`https://${newUrl}`)) {
            setUrlError('Vul een geldige link in.');
        } else {
            setUrlError('');
        }

        setLinkUrl(newUrl);
    }

    useEffect(() => {
        // Fix accessibility issues with Tiptap
        const tiptapElement = editorRef.current?.firstChild;
        if (tiptapElement) {
            tiptapElement.setAttribute('aria-label', 'Rich Text Editor');
            tiptapElement.setAttribute('title', 'Rich Text Editor');
            tiptapElement.setAttribute('name', 'editor-content');
            tiptapElement.setAttribute('id', 'editor-content');
            tiptapElement.setAttribute('role', 'textbox');
            tiptapElement.setAttribute('aria-multiline', 'true');
            tiptapElement.setAttribute('aria-required', required);
            tiptapElement.setAttribute('aria-labelledby', 'editor-label');
            tiptapElement.setAttribute('data-testid', 'RichTextInput');
        }

        if (editor) {
            editor.on('update', () => {
                const content = editor.getText();
                setCharCount(content.length);
                handleSave();
            });
        }
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2" htmlFor="editor-content" id="editor-label">
                    {label} {required && <span className="text-primary">*</span>}
                </label>
            )}
            <div 
                className="rounded-2xl overflow-hidden"
                style={{ 
                    background: '#EFEEEE',
                    boxShadow: 'inset 4px 4px 8px #D1D9E6, inset -4px -4px 8px #FFFFFF'
                }}
            >
                {/* Toolbar */}
                <div className="px-3 py-2 flex flex-wrap gap-1.5 editor-menu bg-gradient-to-b from-white/60 to-transparent border-b border-gray-200/50">
                    <RichTextEditorButton
                        label={'Vetgedrukt'}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="13" height="13"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 16 0 128 0c70.7 0 128 57.3 128 128c0 31.3-11.3 60.1-30 82.3c37.1 22.4 62 63.1 62 109.7c0 70.7-57.3 128-128 128L96 480l-16 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-160L48 96 32 96C14.3 96 0 81.7 0 64zM224 224c35.3 0 64-28.7 64-64s-28.7-64-64-64L112 96l0 128 112 0zM112 288l0 128 144 0c35.3 0 64-28.7 64-64s-28.7-64-64-64l-32 0-112 0z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Cursief'}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="13" height="13"><path d="M128 64c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-58.7 0L160 416l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 480c-17.7 0-32-14.3-32-32s14.3-32 32-32l58.7 0L224 96l-64 0c-17.7 0-32-14.3-32-32z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Onderstreept'}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14"><path d="M16 64c0-17.7 14.3-32 32-32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 128c0 53 43 96 96 96s96-43 96-96l0-128-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 128c0 88.4-71.6 160-160 160s-160-71.6-160-160L64 96 48 96C30.3 96 16 81.7 16 64zM0 448c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 480c-17.7 0-32-14.3-32-32z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Doorgestreept'}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="15" height="15"><path d="M161.3 144c3.2-17.2 14-30.1 33.7-38.6c21.1-9 51.8-12.3 88.6-6.5c11.9 1.9 48.8 9.1 60.1 12c17.1 4.5 34.6-5.6 39.2-22.7s-5.6-34.6-22.7-39.2c-14.3-3.8-53.6-11.4-66.6-13.4c-44.7-7-88.3-4.2-123.7 10.9c-36.5 15.6-64.4 44.8-71.8 87.3c-.1 .6-.2 1.1-.2 1.7c-2.8 23.9 .5 45.6 10.1 64.6c4.5 9 10.2 16.9 16.7 23.9L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l448 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-209.9 0-.4-.1-1.1-.3c-36-10.8-65.2-19.6-85.2-33.1c-9.3-6.3-15-12.6-18.2-19.1c-3.1-6.1-5.2-14.6-3.8-27.4zM348.9 337.2c2.7 6.5 4.4 15.8 1.9 30.1c-3 17.6-13.8 30.8-33.9 39.4c-21.1 9-51.7 12.3-88.5 6.5c-18-2.9-49.1-13.5-74.4-22.1c-5.6-1.9-11-3.7-15.9-5.4c-16.8-5.6-34.9 3.5-40.5 20.3s3.5 34.9 20.3 40.5c3.6 1.2 7.9 2.7 12.7 4.3c0 0 0 0 0 0s0 0 0 0c24.9 8.5 63.6 21.7 87.6 25.6c0 0 0 0 0 0l.2 0c44.7 7 88.3 4.2 123.7-10.9c36.5-15.6 64.4-44.8 71.8-87.3c3.6-21 2.7-40.4-3.1-58.1l-75.7 0c7 5.6 11.4 11.2 13.9 17.2z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Code'}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive('code')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="16" height="16"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Citaat'}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="16" height="16"><path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Opsomming'}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16"><path d="M64 144a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM64 464a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm48-208a48 48 0 1 0 -96 0 48 48 0 1 0 96 0z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Geordende lijst'}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16"><path d="M24 56c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24l0 120 16 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l16 0 0-96-8 0C34.7 80 24 69.3 24 56zM86.7 341.2c-6.5-7.4-18.3-6.9-24 1.2L51.5 357.9c-7.7 10.8-22.7 13.3-33.5 5.6s-13.3-22.7-5.6-33.5l11.1-15.6c23.7-33.2 72.3-35.6 99.2-4.9c21.3 24.4 20.8 60.9-1.1 84.7L86.8 432l33.2 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-88 0c-9.5 0-18.2-5.6-22-14.4s-2.1-18.9 4.3-25.9l72-78c5.3-5.8 5.4-14.6 .3-20.5zM224 64l256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160l256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160l256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z" /></svg>}
                    />
                    <RichTextEditorButton
                        label={'Heading 1'}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        icon={'H1'}
                    />
                    <RichTextEditorButton
                        label={'Heading 2'}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={'H2'}
                    />
                    <RichTextEditorButton
                        label={'Link'}
                        onClick={() => {
                            if (editor.isActive('link')) {
                                editor.chain().focus().unsetLink().run();
                            } else {
                                setIsLinkModalOpen(true);
                            }
                        }}
                        isActive={editor.isActive('link')}
                        icon={
                            editor.isActive('link')
                                ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="20" height="20"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L489.3 358.2l90.5-90.5c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114l-96 96-31.9-25C430.9 239.6 420.1 175.1 377 132c-52.2-52.3-134.5-56.2-191.3-11.7L38.8 5.1zM239 162c30.1-14.9 67.7-9.9 92.8 15.3c20 20 27.5 48.3 21.7 74.5L239 162zM406.6 416.4L220.9 270c-2.1 39.8 12.2 80.1 42.2 110c38.9 38.9 94.4 51 143.6 36.3zm-290-228.5L60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l61.8-61.8-50.6-39.9z" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="20" height="20"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z" /></svg>
                        }
                    />
                </div>
                
                {/* Error message */}
                {internalError && (
                    <div className="px-4 py-2">
                        <Alert text={internalError} />
                    </div>
                )}
                
                {/* Editor content area */}
                <EditorContent
                    ref={editorRef}
                    editor={editor}
                    title="Editor content"
                    className="bg-transparent [&>*]:outline-none [&>div]:min-h-[100px] [&>div]:max-h-[300px] [&>div]:overflow-y-auto [&>div]:resize-y [&>div]:px-4 [&>div]:py-3 [&>div]:text-[var(--text-primary)] [&>div]:text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[var(--text-primary)] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_pre]:bg-gray-700 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-auto [&_pre]:text-sm [&_pre]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)] [&_a]:text-primary [&_a]:underline [&_a]:font-medium [&_a]:cursor-pointer [&_p]:leading-relaxed"
                />
                
                {/* Character count */}
                <div className="px-4 py-2 flex items-center justify-between border-t border-gray-200/50 bg-white/30">
                    <span className="text-xs text-[var(--text-muted)]">Gebruik de toolbar voor opmaak</span>
                    <span className={`text-xs font-medium ${charCount > max ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                        {charCount}/{max}
                    </span>
                </div>
            </div>
            <Modal isModalOpen={isLinkModalOpen} setIsModalOpen={setIsLinkModalOpen} modalHeader="Link toevoegen" modalIcon="link">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="link-ref" className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                            Link naar de website
                        </label>
                        <div 
                            className={`flex items-center rounded-xl overflow-hidden transition-all ${urlError ? 'ring-2 ring-red-400' : 'focus-within:ring-2 focus-within:ring-primary/50'}`}
                            style={{ 
                                background: '#EFEEEE',
                                boxShadow: 'inset 3px 3px 6px #D1D9E6, inset -3px -3px 6px #FFFFFF'
                            }}
                        >
                            <div className="shrink-0 select-none text-sm text-[var(--text-muted)] pl-4 pr-1 py-3 bg-gray-200/50">https://</div>
                            <input
                                id="link-ref"
                                name="link-ref"
                                type="text"
                                placeholder="www.voorbeeld.nl"
                                value={linkUrl}
                                onChange={changeLinkUrl}
                                className="block min-w-0 grow py-3 px-2 text-sm text-[var(--text-primary)] placeholder:text-gray-400 focus:outline-none bg-transparent"
                            />
                        </div>
                        {urlError && (
                            <p className='text-red-500 text-sm mt-2 font-medium'>{urlError}</p>
                        )}
                    </div>
                    
                    <button
                        onClick={handleLinkInsert}
                        className="w-full rounded-xl py-3 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 bg-gradient-to-r from-primary to-orange-600"
                        style={{ boxShadow: '0 4px 14px rgba(255, 127, 80, 0.3)' }}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">add_link</span>
                            Link toevoegen
                        </span>
                    </button>
                </div>
            </Modal>
        </div>
    );
};