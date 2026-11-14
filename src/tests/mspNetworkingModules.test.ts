import { describe, expect, it } from 'vitest';
import { getModuleById, getModuleQuestions, modules } from '../data/modules';
import { mspNetworkingModules } from '../data/modules/mspNetworking';

describe('MSP networking series', () => {
  it('adds ten MSP networking modules to the catalogue, resolvable by id', () => {
    expect(mspNetworkingModules.map((m) => m.id)).toEqual([
      'net-dhcp', 'net-dns', 'net-vlans', 'net-routing', 'net-nat-firewall',
      'net-ports', 'net-vpn', 'net-wifi', 'net-troubleshooting', 'net-ad-m365',
    ]);
    for (const m of mspNetworkingModules) {
      expect(getModuleById(m.id)).toBe(m);
      expect(m.domain).toBe('Networking');
      expect(m.targetEnvironment).toBe('MSP');
    }
  });

  it('gives every module lessons, flashcards, scored questions and study patterns', () => {
    for (const m of mspNetworkingModules) {
      expect(m.sections.length).toBeGreaterThanOrEqual(8);
      expect(m.flashcards.length).toBeGreaterThanOrEqual(6);
      expect(m.modulePattern.diagnosticQuestions.length).toBeGreaterThan(0);
      const questions = getModuleQuestions(m.id);
      expect(questions.length).toBeGreaterThanOrEqual(5);
      for (const q of m.quiz) {
        expect(q.type).toBe('mcq');
        if (q.type === 'mcq') expect(q.options.map((o) => o.id)).toContain(q.correctOptionId);
        expect(q.dcsContext).toBeTruthy();
        expect(q.recommendedModuleId).toBe(m.id);
      }
    }
  });

  it('uses module, question and flashcard ids that collide with nothing else', () => {
    const others = modules.filter((m) => !mspNetworkingModules.includes(m));
    const otherIds = new Set(others.flatMap((m) => [m.id, ...m.quiz.map((q) => q.id), ...m.flashcards.map((f) => f.id)]));
    const ours = mspNetworkingModules.flatMap((m) => [m.id, ...m.quiz.map((q) => q.id), ...m.flashcards.map((f) => f.id)]);
    expect(new Set(ours).size).toBe(ours.length);
    expect(ours.filter((id) => otherIds.has(id))).toEqual([]);
  });

  it('renders as plain prose like the rest of the catalogue (no markdown markers or tables)', () => {
    for (const m of mspNetworkingModules) {
      for (const s of m.sections) {
        expect(s.bodyMarkdown).not.toMatch(/\*\*|`|^\|/m);
      }
    }
  });
});
