"use client";

import { useEffect, useRef, useState } from 'react';
import { strictQuestionBank } from '../../data/questions';
import { adapt, initialAdaptiveState, levelLabel, parseAdaptiveState, type AdaptiveState, type Difficulty } from '../../lib/adaptiveLearning';
import type { AssessmentAttempt, AssessmentQuestion } from '../../types/assessment';
import AssessmentSession from './AssessmentSession';
import { recordAssessmentAttempt, saveProgress, getStoredProgressSnapshot } from '../../lib/progress';
import { ShieldAlert, Trophy, Target, BookOpen } from 'lucide-react';

const storageKey = 'dcspd:adaptive-practice:v1';
const levelOf = (q: AssessmentQuestion): Difficulty => q.difficulty === 'challenge' ? 3 : q.difficulty === 'stretch' ? 2 : 1;
function pickQuestion(used: Set<string>, level: Difficulty, weakTopic?: string): AssessmentQuestion | null {
  const candidates = strictQuestionBank.filter(q=>!used.has(q.id));
  candidates.sort((a,b)=>{
    const score=(q: AssessmentQuestion)=>
      Math.abs(levelOf(q)-level)*10 +
      (weakTopic && q.weakTopic===weakTopic ? -4:0) +
      (q.type==='mcq'||q.type==='order-steps'||q.type==='categorization'?0:2);
    return score(a)-score(b) || a.id.localeCompare(b.id);
  });
  return candidates[0] || null;
}
function initialExamQuestions(): AssessmentQuestion[] {
  const selected: AssessmentQuestion[] = [];
  const used = new Set<string>();
  for(let i=0;i<20;i++){
    const question=pickQuestion(used,2);
    if(!question)break;
    selected.push(question);used.add(question.id);
  }
  return selected;
}
export default function PracticeExam() {
  const [examStarted, setExamStarted] = useState(false);
  const [examComplete, setExamComplete] = useState(false);
  const [adaptive,setAdaptive] = useState<AdaptiveState>(initialAdaptiveState());
  const [ready,setReady] = useState(false);
  const countRef = useRef(0);
  const [saveError,setSaveError] = useState("");
  useEffect(()=>{try{setAdaptive(parseAdaptiveState(window.localStorage.getItem(storageKey)));}catch{setSaveError("Your browser cannot load past adaptive practice.");}setReady(true);},[]);
  const [progress, setProgress] = useState(() => getStoredProgressSnapshot());

  const [questions,setQuestions] = useState<AssessmentQuestion[]>(initialExamQuestions);
  function recordAdaptiveAttempt(attempt: AssessmentAttempt) {
    const index=countRef.current++;
    const verified = attempt.scoreBreakdown.autoMarked || Boolean(attempt.rubricGrade);
    const correct = attempt.scoreBreakdown.autoMarked
      ? attempt.scoreBreakdown.correctness >= 0.99 && attempt.scoreBreakdown.total >= 0.7
      : Boolean(attempt.rubricGrade && attempt.rubricGrade.percentage >= 80 && attempt.rubricGrade.privacyFlags.length === 0);
    const updated = verified ? adapt(adaptive,correct,attempt.questionId)
      : {...adaptive,seen:[...new Set([...adaptive.seen,attempt.questionId])].slice(-300)};
    setAdaptive(updated);
    try{window.localStorage.setItem(storageKey,JSON.stringify(updated));setSaveError("");}
    catch{setSaveError("Adaptive history could not be saved to this browser.");}
    setQuestions(previous=>{
      const nextIndex=index+1;
      if(nextIndex>=previous.length)return previous;
      const used=new Set([...updated.seen,...previous.slice(0,nextIndex).map(x=>x.id)]);
      const replacement=pickQuestion(used,updated.level,correct?undefined:attempt.weakTopic);
      if(!replacement)return previous;
      const next=[...previous];next[nextIndex]=replacement;return next;
    });
    setProgress(old=>{const next=recordAssessmentAttempt(old,attempt);saveProgress(next);return next;});
  }

  if (!examStarted) {
    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert size={24} />
              <span className="text-sm font-bold uppercase tracking-widest">Adaptive Practice</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              DCS ICT Adaptive Skills Practice
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              This adaptive practice selects 20 graded exercises covering hardware, networking, 
              DCS-specific workflows, and support quality standards.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Target className="text-slate-900" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">20 Questions</div>
                  <div className="text-xs text-slate-500">Mixed domains and formats</div>
                </div>
              </div>
              <div className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <BookOpen className="text-slate-900" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Full Rubrics</div>
                  <div className="text-xs text-slate-500">Self-rating against model answers</div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => {countRef.current=0;setQuestions(initialExamQuestions());setExamStarted(true);}} disabled={!ready}
                className="rounded-full bg-slate-900 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Begin Exam
              </button>
              <div className="text-xs text-slate-400 italic">
                Approx. 30-40 minutes required
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-bold text-slate-900">Exam Standards</h2>
          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">Level 1 Safety:</span> Every answer must prioritize safety, triage, and escalation boundaries.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">Adaptive difficulty:</span> Starts at Practitioner. Three right moves up; two wrong in three moves down. Only auto-marked answers or rubric-graded responses change difficulty. No IQ inference.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">Privacy First:</span> Answers containing sensitive PII or confidential internal data are penalized.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="rounded-xl border p-3 text-sm">Adaptive level: <strong>{levelLabel(adaptive.level)}</strong> · {adaptive.correct}/{adaptive.attempts} verified correct. {saveError} Unassessed free-text self-ratings do not unlock harder questions.</p>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-rose-600" size={20} />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Exam in Progress</span>
        </div>
        <button 
          onClick={() => { if(confirm('Exit this practice session? Completed answers stay saved.')) setExamStarted(false); }}
          className="text-xs text-slate-400 hover:text-rose-600"
        >
          Exit Exam
        </button>
      </div>

      <AssessmentSession
        questions={questions}
        source="strict-quiz"
        title="DCS ICT Practice Exam"
        description="Comprehensive simulation. Focus on note quality and ownership boundaries."
        onRecordAttempt={recordAdaptiveAttempt}
        onSessionComplete={() => setExamComplete(true)}
      />
    </div>
  );
}
