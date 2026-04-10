import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const SEED_DATA_PATH = path.resolve(__dirname, '../seed/cortex-systems.json');
const WIKI_DIR = path.resolve(__dirname, '../../wiki');

async function seed() {
  const seedData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf-8'));

  // 1. Clear wiki directory
  if (fs.existsSync(WIKI_DIR)) {
    fs.rmSync(WIKI_DIR, { recursive: true });
  }
  fs.mkdirSync(WIKI_DIR);

  // 2. Populate wiki pages
  for (const page of seedData.wiki) {
    const pageDir = path.join(WIKI_DIR, page.type || 'untyped');
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    const filePath = path.join(pageDir, `${page.id}.md`);
    const frontmatter = {
      title: page.title,
      type: page.type,
      source: page.source || 'INTERNAL',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: ['seed-data']
    };

    // Replace [[WikiLinks]] in content
    const content = page.content.replace(/\[\[(.*?)\]\]/g, (match: string, p1: string) => {
        return `[[${p1}]]`;
    });

    const fileContent = matter.stringify(content, frontmatter);
    fs.writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`Created wiki page: ${page.id}`);
  }

  // 3. Create a specialized JSON for UI metrics that doesn't fit in wiki
  const analysisDir = path.resolve(__dirname, '../seed/analysis');
  if (!fs.existsSync(analysisDir)) {
    fs.mkdirSync(analysisDir, { recursive: true });
  }

  const uiData = {
    sops: seedData.sops,
    syncHistory: seedData.syncHistory,
    customerIntel: seedData.customerIntel,
    dashboardStats: seedData.dashboardStats
  };

  fs.writeFileSync(
    path.join(analysisDir, 'ui-data.json'),
    JSON.stringify(uiData, null, 2),
    'utf-8'
  );
  console.log('Created analysis/ui-data.json');

  console.log('Seeding complete.');
}

seed().catch(console.error);
