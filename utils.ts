
export function kebabCase(str: string): string {
    if (!str || typeof str !== 'string') {
        // Fallback for undefined, null, or non-string inputs.
        // Using a timestamp to ensure uniqueness.
        return `untitled-lecture-${Date.now()}`;
    }
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-');          // Remove duplicate hyphens
}

export function markdownToHtml(md: string): string {
    if (typeof md !== 'string' || !md.trim()) {
        return '<p class="text-gray-400 italic">No content available for this slide.</p>';
    }
    let html = md;
    // Headers (## Header -> <h2>Header</h2>)
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4">$1</h1>');
    
    // Bold (**text** -> <strong>text</strong>)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic (*text* -> <em>text</em>)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Unordered list (* item -> <ul><li>item</li></ul>)
    // Process list items line by line
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    // Wrap consecutive <li>s in <ul>
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // Fix multiple <ul> tags for a single list
    html = html.replace(/<\/ul>\s?<ul>/g, '');


    // Paragraphs (split by newlines, wrap in <p>)
    html = html.split(/\n\n+/).map(paragraph => {
        if (paragraph.startsWith('<h') || paragraph.startsWith('<ul')) {
            return paragraph;
        }
        return `<p class="my-2 leading-relaxed">${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}

export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // remove the header: 'data:*/*;base64,'
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}