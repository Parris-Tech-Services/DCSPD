import type { AssessmentQuestion, AssessmentDifficulty, WeakTopicKey } from '../../types/assessment';
import type { ModuleLevel, TrainingModule } from '../../types/training';
import { createModule, mcq, reviewSchedule } from './helpers';
import { markdownToPlainText, networkingCurriculum, type NetModule } from '../networking/networkingCurriculum';

// MSP networking series: the ten topics that follow subnetting, at MSP
// technician depth. Content is shared with the other Parris Tech learning
// apps (../networking/networkingCurriculum.ts); this file adapts it to
// DCSPD modules and adds the school (DCS) angle for each topic.

const DCS_CONTEXT: Record<string, string> = {
  'net-dhcp': 'In a school, a full guest or student Wi-Fi scope at the start of term looks exactly like scope exhaustion: early arrivals work, later devices get 169.254 addresses.',
  'net-dns': 'School web filtering, internal Schoolbox/Sentral links and staff email all depend on DNS; "the internet is down" in a classroom is often a DNS or filtering issue.',
  'net-vlans': 'Schools separate staff, student, guest, AV/displays and CCTV networks; a classroom display that suddenly can\'t be found is often a port in the wrong VLAN.',
  'net-routing': 'Separate student and staff subnets only talk through the core switch or firewall, so "works in the library but not the classroom" can be a routing or rule difference.',
  'net-nat-firewall': 'School firewalls filter student traffic and block inbound access; ask before requesting any port forward, and never expose admin interfaces.',
  'net-ports': 'Printing (SMB 445), Teams, web filtering and remote support all use known ports, which helps you describe a symptom clearly when escalating.',
  'net-vpn': 'Staff working from home reach school systems over VPN or cloud services; a home router on the same range as the school network breaks access.',
  'net-wifi': 'Classrooms full of devices stress Wi-Fi: channel planning, AP placement and separate student/staff SSIDs matter more than raw speed.',
  'net-troubleshooting': 'Scope first: one student device, one classroom or the whole campus point to very different causes and escalation paths.',
  'net-ad-m365': 'School logins, Group Policy and Microsoft 365 depend on AD DNS and correct time; a wrong clock after a power cut can stop staff signing in.',
};

const LEVEL: Record<string, ModuleLevel> = {
  'net-dhcp': 'L1', 'net-dns': 'L1', 'net-vlans': 'L1', 'net-routing': 'L2', 'net-nat-firewall': 'L2',
  'net-ports': 'L1', 'net-vpn': 'L2', 'net-wifi': 'L1', 'net-troubleshooting': 'L1', 'net-ad-m365': 'L2',
};

const WEAK_TOPIC: Record<string, WeakTopicKey> = {
  'net-dhcp': 'dns-dhcp-gateway', 'net-dns': 'dns-dhcp-gateway', 'net-vlans': 'vlan-firewall-rules',
  'net-routing': 'dns-dhcp-gateway', 'net-nat-firewall': 'vlan-firewall-rules', 'net-ports': 'ports-protocols',
  'net-vpn': 'network-services', 'net-wifi': 'wireless-networks', 'net-troubleshooting': 'network-troubleshooting',
  'net-ad-m365': 'network-services',
};

const DIFFICULTY: AssessmentDifficulty[] = ['foundation', 'foundation', 'stretch', 'stretch', 'challenge', 'challenge'];

function quiz(m: NetModule): AssessmentQuestion[] {
  return m.quiz.map((q, i) =>
    mcq({
      id: `msp-${q.id}`,
      prompt: q.question,
      options: q.options.map((label, j) => ({ id: `${q.id}-${String.fromCharCode(97 + j)}`, label })),
      correctOptionId: `${q.id}-${String.fromCharCode(97 + q.answerIndex)}`,
      domain: m.title,
      difficulty: DIFFICULTY[i] ?? 'challenge',
      explanation: q.explanation,
      modelAnswer: q.options[q.answerIndex],
      commonMistakes: q.options.filter((_, j) => j !== q.answerIndex).map((o) => `Choosing "${o}"`),
      dcsContext: DCS_CONTEXT[m.id],
      mspContext: m.whyItMatters,
      reviewSchedule,
      recommendedModuleId: m.id,
      weakTopic: WEAK_TOPIC[m.id],
    })
  );
}

function toModule(m: NetModule): TrainingModule {
  const s = m.scenario;
  return createModule({
    id: m.id,
    title: `MSP Networking: ${m.title}`,
    description: m.summary,
    domain: 'Networking',
    level: LEVEL[m.id],
    targetEnvironment: 'MSP',
    estimatedMinutes: 30,
    tags: ['msp networking', m.shortTitle.toLowerCase(), ...m.keyTerms.slice(0, 4).map((k) => k.term.toLowerCase())],
    learningObjectives: m.objectives,
    dcsRelevance: [DCS_CONTEXT[m.id]],
    mspRelevance: [m.whyItMatters],
    sections: [
      ...m.sections.map((sec) => ({ id: `${m.id}-${sec.id}`, title: sec.title, bodyMarkdown: markdownToPlainText(sec.body) })),
      {
        id: `${m.id}-terms`,
        title: 'Key terms',
        bodyMarkdown: m.keyTerms.map((k) => `- ${k.term}: ${k.definition}`).join('\n'),
      },
      {
        id: `${m.id}-commands`,
        title: 'Commands to know',
        bodyMarkdown: m.commands.map((c) => `- ${c.command}\n  ${c.purpose}`).join('\n'),
      },
      {
        id: `${m.id}-mistakes`,
        title: 'Common mistakes',
        bodyMarkdown: m.commonMistakes.map((x) => `- ${x}`).join('\n'),
        takeaway: m.commonMistakes[0],
      },
      {
        id: `${m.id}-sources`,
        title: 'Sources',
        bodyMarkdown: m.sources.map((src) => `- ${src.title}\n  ${src.url}`).join('\n'),
      },
    ],
    flashcards: m.flashcards.map((f) => ({ id: `msp-${f.id}`, front: f.front, back: f.back })),
    quiz: quiz(m),
    scenarioPrompts: [
      {
        id: `${m.id}-scenario`,
        title: s.title,
        prompt: `${s.ticket.client}: "${s.ticket.summary}" ${s.ticket.symptoms.join(' ')} Recent change: ${s.ticket.recentChanges.join(' ')} What do you check first, what do you expect to find, and what would you change?`,
      },
      ...s.steps.slice(1).map((step, i) => ({ id: `${m.id}-scenario-step-${i + 2}`, title: `${s.title}: next step`, prompt: step.prompt })),
    ],
    practicalOutputs: [
      {
        id: `${m.id}-ticket-note`,
        title: 'Write the ticket note',
        description: `Write the resolution note for "${s.title}" (cause, evidence, exact change, verification). Then compare it with this example: ${s.ticketNote}`,
      },
    ],
    microLearningSummary: `${m.summary} ${m.whyItMatters}`,
  });
}

export const mspNetworkingModules: TrainingModule[] = networkingCurriculum.map(toModule);
