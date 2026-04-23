import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import slugify from 'slugify';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_CONTENT_DIR = path.join(__dirname, '../content/blog');
const BLOG_OUTPUT_DIR = path.join(__dirname, '../blog');
const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const VITE_CONFIG_PATH = path.join(__dirname, '../vite.config.js');

const TEMPLATE_PATH = path.join(BLOG_OUTPUT_DIR, 'template.html');

async function generateBlog() {
    console.log('🚀 Starting Blog Generation...');

    // 1. Ensure directories exist
    await fs.ensureDir(BLOG_OUTPUT_DIR);

    // 2. Read all markdown files
    const files = await fs.readdir(BLOG_CONTENT_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const posts = [];
    const viteInputs = {
        main: './index.html',
        order: './order/index.html',
        menu: './menu/index.html',
        game: './game/index.html',
        blog: './blog/index.html'
    };

    // 3. Process each post
    for (const file of mdFiles) {
        const filePath = path.join(BLOG_CONTENT_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { data, content: body } = matter(content);

        const slug = data.slug || slugify(data.title, { lower: true, strict: true });
        const htmlBody = marked.parse(body);

        // Auto-Featured Image Logic
        let featuredImage = data.image;
        if (!featuredImage) {
            const imgMatch = htmlBody.match(/<img[^>]+src="([^">]+)"/);
            featuredImage = imgMatch ? imgMatch[1] : '/assets/img/og-preview.webp';
        }

        // Ensure path starts with /
        if (featuredImage && !featuredImage.startsWith('/') && !featuredImage.startsWith('http')) {
            featuredImage = '/' + featuredImage;
        }
        
        // Calculate reading time
        const wordsPerMinute = 200;
        const noOfWords = body.split(/\s+/g).length;
        const readingTime = Math.ceil(noOfWords / wordsPerMinute);

        const postMetadata = {
            ...data,
            slug,
            readingTime: `${readingTime} min read`,
            body: htmlBody,
            image: featuredImage,
            date: data.date || new Date().toISOString().split('T')[0]
        };

        posts.push(postMetadata);

        // Track the vite input
        viteInputs[`blog-${slug}`] = `./blog/${slug}/index.html`;
    }

    // Sort posts by date desc
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. Save blog-data.json
    await fs.writeJson(path.join(PUBLIC_DIR, 'blog-data.json'), posts, { spaces: 2 });
    console.log('✅ blog-data.json generated.');

    // 5. Update Sitemap
    await updateSitemap(posts);
    console.log('✅ sitemap.xml updated.');

    // 6. Update Vite Config
    await updateViteConfig(viteInputs);
    console.log('✅ vite.config.js updated.');

    // 7. Render Pages
    await renderPages(posts);
    console.log('✅ All blog pages rendered.');
}

async function renderPages(posts) {
    const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');

    for (const post of posts) {
        const relativeImagePath = post.image || '/assets/img/og-preview.webp';
        const absoluteImageUrl = (relativeImagePath.startsWith('http')) 
            ? relativeImagePath 
            : `https://mieayam.pakdul.in${relativeImagePath}`;

        let html = template
            .replace(/{{title}}/g, post.title)
            .replace(/{{description}}/g, post.description || '')
            .replace(/{{content}}/g, post.body)
            .replace(/{{date}}/g, post.date)
            .replace(/{{slug}}/g, post.slug)
            .replace(/{{readingTime}}/g, post.readingTime)
            .replace(/{{category}}/g, post.category || 'Berita')
            .replace(/{{ogImage}}/g, absoluteImageUrl)
            .replace(/{{image}}/g, relativeImagePath);

        const postDir = path.join(BLOG_OUTPUT_DIR, post.slug);
        await fs.ensureDir(postDir);
        const postFilePath = path.join(postDir, 'index.html');
        await fs.writeFile(postFilePath, html);
    }
}

async function updateSitemap(posts) {
    console.log('📝 Updating Sitemap...');
    const baseUrl = 'https://mieayam.pakdul.in';
    const today = new Date().toISOString().split('T')[0];

    // Core pages that should always be there
    const corePages = [
        { loc: `${baseUrl}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
        { loc: `${baseUrl}/order/`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
        { loc: `${baseUrl}/menu/`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
        { loc: `${baseUrl}/game/`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
        { loc: `${baseUrl}/blog/`, lastmod: today, changefreq: 'weekly', priority: '0.9' }
    ];

    const blogPages = posts.map(post => ({
        loc: `${baseUrl}/blog/${post.slug}/`,
        lastmod: post.date,
        changefreq: 'monthly',
        priority: '0.7'
    }));

    const allPages = [...corePages, ...blogPages];

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    await fs.writeFile(SITEMAP_PATH, sitemapContent.trim() + '\n');
}

async function updateViteConfig(inputs) {
    let config = await fs.readFile(VITE_CONFIG_PATH, 'utf-8');
    
    const startMarker = '/* MABE_INPUTS_START */';
    const endMarker = '/* MABE_INPUTS_END */';
    
    const startIndex = config.indexOf(startMarker);
    const endIndex = config.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
        let inputsJson = JSON.stringify(inputs, null, 8).replace(/"/g, "'");
        let replacement = `${startMarker}\n      input: ${inputsJson.slice(0, -1)}      }\n      ${endMarker}`;
        
        config = config.slice(0, startIndex) + replacement + config.slice(endIndex + endMarker.length);
        await fs.writeFile(VITE_CONFIG_PATH, config);
    }
}

// Check if marked needs to generate IDs for headings
marked.use({
    gfm: true,
    breaks: true
});

generateBlog().catch(console.error);
