import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { preprocessMarkdown } from '../services';

export default function RichTextViewer({ text='', flatten=false }) {
    const processedText = preprocessMarkdown(text);
    const htmlRichText = marked(processedText); // in html format
    const sanitizedRichText = DOMPurify.sanitize(htmlRichText, {
        ALLOWED_ATTR: ['href', 'target']
    });

    return (
        <div
            className={`
                [&_ul]:list-disc [&_ul]:pl-10
                [&_ol]:list-decimal [&_ol]:pl-10
                [&_h1]:font-semibold [&_h2]:font-semibold
                ${!flatten
                    // Enabling 'flatten' makes headings smaller, for shorter descriptions etc.
                    ? `[&_h1]:text-3xl [&_h2]:text-2xl`
                    : `[&_h1]:text-lg [&_h2]:text-lg`
                }
                [&_pre]:bg-gray-200 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:overflow-auto [&_pre]:text-sm [&_pre]:shadow-md
                [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-2
                [&_a]:text-[#0000EE] [&_a]:underline [&_a:visited]:text-[#551A8B]
            `}
            dangerouslySetInnerHTML={{__html: sanitizedRichText}}
        />
    )
}