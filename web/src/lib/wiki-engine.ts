import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Core Types
export type PageType = 'source' | 'entity' | 'concept' | 'project' | 'decision' | 'analysis';

export interface WikiPage {
    id: string;
    filePath: string;
    title: string;
    type: PageType | 'untyped';
    source: string;
    content: string;
    frontmatter: Record<string, any>;
    outboundLinks: string[];
}

// Utility to find all .md files in the wiki directory
async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files).filter(f => f.endsWith('.md'));
}

export async function loadWikiPages(): Promise<WikiPage[]> {
    const wikiDir = path.resolve(process.cwd(), '../wiki');
    const files = await getFiles(wikiDir);

    const pages: WikiPage[] = [];
    for (const file of files) {
        const rawContent = await readFile(file, 'utf-8');
        const { data, content } = matter(rawContent);

        // Extract [[WikiLinks]]
        const linkRegex = /\[\[(.*?)\]\]/g;
        const outboundLinks = Array.from(content.matchAll(linkRegex)).map(match => match[1]);

        const relPath = path.relative(wikiDir, file);
        const id = path.basename(file, '.md');

        pages.push({
            id,
            filePath: relPath,
            title: data.title || id,
            type: data.type || 'untyped',
            source: data.source || 'INTERNAL',
            content,
            frontmatter: data,
            outboundLinks
        });
    }
    return pages;
}

export function buildGraph(pages: WikiPage[]) {
    const nodes = pages.map(p => ({
        id: p.id,
        label: p.title,
        type: p.type,
        source: p.source,
        val: 1 // Base importance
    }));

    const links: { source: string; target: string }[] = [];
    const idMap = new Map(pages.map(p => [p.title.toLowerCase(), p.id]));

    for (const page of pages) {
        for (const linkTitle of page.outboundLinks) {
            const targetId = idMap.get(linkTitle.toLowerCase());
            if (targetId) {
                links.push({ source: page.id, target: targetId });
            }
        }
    }

    // Update val based on in-degree
    const inDegree = new Map<string, number>();
    links.forEach(l => {
        inDegree.set(l.target, (inDegree.get(l.target) || 0) + 1);
    });

    nodes.forEach(n => {
        n.val = (inDegree.get(n.id) || 0) + 2;
    });

    return { nodes, links };
}

export async function saveWikiPage(type: string, id: string, data: any, content: string = '') {
    const wikiDir = path.resolve(process.cwd(), '../wiki');
    const targetDir = path.join(wikiDir, type);
    const filePath = path.join(targetDir, `${id}.md`);

    await mkdir(targetDir, { recursive: true });

    const fileContent = matter.stringify(content, data);
    await writeFile(filePath, fileContent, 'utf-8');
}
