import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../blog');
const DIST_DIR = path.join(__dirname, '../dist');
const BLOG_DATA = path.join(__dirname, '../public/blog-data.json');

async function clean() {
    console.log('🧹 Cleaning build and generated files...');

    // 1. Remove dist
    if (await fs.pathExists(DIST_DIR)) {
        await fs.remove(DIST_DIR);
        console.log('✅ Removed dist/');
    }

    // 2. Remove generated blog directories (leave index.html and template.html)
    if (await fs.pathExists(BLOG_DIR)) {
        const items = await fs.readdir(BLOG_DIR);
        for (const item of items) {
            const fullPath = path.join(BLOG_DIR, item);
            const stats = await fs.stat(fullPath);
            
            if (stats.isDirectory()) {
                await fs.remove(fullPath);
                console.log(`✅ Removed blog/${item}/`);
            }
        }
    }

    // 3. Remove blog-data.json
    if (await fs.pathExists(BLOG_DATA)) {
        await fs.remove(BLOG_DATA);
        console.log('✅ Removed blog-data.json');
    }

    console.log('✨ Workspace cleaned!');
}

clean().catch(console.error);
