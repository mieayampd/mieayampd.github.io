import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const BLOG_CONTENT_DIR = path.join(ROOT_DIR, 'content/blog');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const BASE_URL = 'https://mieayam.pakdul.in';

async function generateLLMs() {
    console.log('🚀 Generating LLMs.txt...');

    const indexHtml = await fs.readFile(INDEX_PATH, 'utf-8');
    
    // Extract Meta Data
    const titleMatch = indexHtml.match(/<title>(.*?)<\/title>/);
    const descMatch = indexHtml.match(/<meta name="description" content="(.*?)"/);
    
    const siteTitle = titleMatch ? titleMatch[1] : 'Mie Ayam Pak Dul Bumiayu';
    const siteDesc = descMatch ? descMatch[1] : 'Mie ayam enak di Bumiayu.';

    // 1. Parse Sections (Anchors)
    const sections = [];
    const sectionRegex = /<section id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
    let match;

    while ((match = sectionRegex.exec(indexHtml)) !== null) {
        const id = match[1];
        const content = match[2];
        
        if (id === 'faq') continue; // Skip hidden/utility sections if needed

        // Extract heading from section
        const hMatch = content.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/);
        let label = hMatch ? hMatch[1].replace(/<[^>]*>/g, '').trim() : id.charAt(0).toUpperCase() + id.slice(1);
        
        // Clean up label (remove newlines etc)
        label = label.replace(/\s+/g, ' ');

        // Brief description (first <p> tag truncated)
        const pMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/);
        let desc = pMatch ? pMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        if (desc.length > 100) desc = desc.substring(0, 97) + '...';

        sections.push({ id, label, desc });
    }

    // 2. Read Blog Posts
    const blogPosts = [];
    if (await fs.pathExists(BLOG_CONTENT_DIR)) {
        const files = await fs.readdir(BLOG_CONTENT_DIR);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const content = await fs.readFile(path.join(BLOG_CONTENT_DIR, file), 'utf-8');
                const { data, content: body } = matter(content);
                blogPosts.push({
                    title: data.title,
                    description: data.description || body.substring(0, 100).replace(/#/g, '').trim(),
                    slug: data.slug || file.replace('.md', ''),
                    fullContent: body
                });
            }
        }
    }

    // 3. Generate llms.txt
    let llmsTxt = `# ${siteTitle}\n\n`;
    llmsTxt += `> ${siteDesc}\n\n`;

    llmsTxt += `## Main Sections (Anchors)\n\n`;
    for (const s of sections) {
        llmsTxt += `- [${s.label}](${BASE_URL}/#${s.id})${s.desc ? ': ' + s.desc : ''}\n`;
    }

    llmsTxt += `\n## Blog Articles\n\n`;
    for (const post of blogPosts) {
        llmsTxt += `- [${post.title}](${BASE_URL}/blog/${post.slug}/): ${post.description}\n`;
    }

    llmsTxt += `\n## Mini Game\n\n`;
    llmsTxt += `- [Mini Game](${BASE_URL}/game/): Main mini game seru sambil nunggu pesanan.\n`;

    llmsTxt += `\n## Resources\n\n`;
    llmsTxt += `- [Full Context](${BASE_URL}/llms-full.txt): Comprehensive markdown version of the entire site.\n`;

    await fs.writeFile(path.join(PUBLIC_DIR, 'llms.txt'), llmsTxt);
    console.log('✅ llms.txt generated.');

    // 4. Generate llms-full.txt
    let llmsFullTxt = `# Full Context: ${siteTitle}\n\n`;
    llmsFullTxt += `This file contains the full content of the website for LLM context.\n\n`;
    
    llmsFullTxt += `## Landing Page Content\n\n`;
    for (const s of sections) {
        // Extract text only from section for full txt
        const sectionText = indexHtml.match(new RegExp(`<section id="${s.id}"[^>]*>([\\s\\S]*?)<\/section>`))[1]
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        llmsFullTxt += `### ${s.label}\n\n${sectionText}\n\n`;
    }

    llmsFullTxt += `## Blog Content\n\n`;
    for (const post of blogPosts) {
        llmsFullTxt += `### ${post.title}\n\n${post.fullContent}\n\n---\n\n`;
    }

    await fs.writeFile(path.join(PUBLIC_DIR, 'llms-full.txt'), llmsFullTxt);
    console.log('✅ llms-full.txt generated.');
}

generateLLMs().catch(console.error);
