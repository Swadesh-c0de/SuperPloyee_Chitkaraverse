"use server";

import { loadWikiPages, buildGraph, saveWikiPage, type WikiPage } from './wiki-engine';
import { revalidatePath } from 'next/cache';

import { getSeedDashboardStats } from './seed-data';

export async function getDashboardData() {
    try {
        const pages = await loadWikiPages();
        const graph = buildGraph(pages);
        const seedStats = getSeedDashboardStats();

        const typeCounts: Record<string, number> = {};
        pages.forEach(p => {
            typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
        });

        return {
            success: true,
            data: {
                nodes: graph.nodes,
                links: graph.links,
                stats: {
                    totalFiles: pages.length,
                    typeCounts,
                    latency: seedStats.latency,
                    integrity: seedStats.integrity
                }
            }
        };
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        return { success: false, error: 'Failed to synchronize with neural net.' };
    }
}

export async function submitOnboarding(data: {
    company: string;
    mission: any;
    departments: any[];
    useCases: string[];
}) {
    try {
        const now = new Date().toISOString();

        // 1. Create/Update Company Entity
        await saveWikiPage('entities', 'company', {
            type: 'entity',
            entity_type: 'company',
            title: data.company,
            created: now,
            updated: now,
            status: 'active',
            tags: ['onboarding-core']
        }, `## Mission Overview\n\n${data.mission.oneLiner}\n\n## Target Customer\n\n${data.mission.customer}\n\n## Core Problem\n\n${data.mission.biggestProblem}`);

        // 2. Update System Overview
        await saveWikiPage('.', 'overview', {
            type: 'analysis',
            title: 'Neural Net Overview',
            created: now,
            updated: now,
            sectors: data.departments.map(d => d.name),
            objectives: data.useCases,
            tags: ['system-meta']
        }, `System initialization complete. The knowledge base is now aligned for ${data.departments.length} sectors and ${data.useCases.length} core objectives.`);

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Onboarding submission failed:', error);
        return { success: false, error: 'Neural initialization failed.' };
    }
}

export async function neuralSearch(query: string) {
    try {
        const pages = await loadWikiPages();
        const lowerQuery = query.toLowerCase();

        const results = pages.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.content.toLowerCase().includes(lowerQuery)
        ).map(p => ({
            id: p.id,
            title: p.title,
            type: p.type,
            snippet: p.content.substring(0, 100) + '...'
        }));

        return { success: true, results };
    } catch (error) {
        return { success: false, error: 'Search protocols offline.' };
    }
}
