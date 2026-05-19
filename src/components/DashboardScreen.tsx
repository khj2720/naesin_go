import React, { useMemo, useState } from 'react';
import { Moon, Sun, RotateCcw } from 'lucide-react';
import { ClassData, Student, aggregateSchoolWide } from '../lib/parser';
import { 
  analyzeStudent, computeAvgGrade, getRank, getPercentile, SubjectAnalysis 
} from '../lib/grading';
import { RadarChart } from './RadarChart';
import { formatSubjectName } from '../lib/utils';

interface DashboardScreenProps {
  classes: ClassData[];
  student: Student;
  classNum: number;
  onChangeStudent: (student: Student, classNum: number) => void;
  onReset: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export function DashboardScreen({ classes, student, classNum, onChangeStudent, onReset, toggleTheme, isDark }: DashboardScreenProps) {
  const [avgMode, setAvgMode] = useState<'weighted' | 'simple'>('weighted');
  const [sortState, setSortState] = useState<{ col: string | null; dir: 'asc'|'desc' }>({ col: null, dir: 'asc' });
  
  const allStudentsFlat = useMemo(() => classes.flatMap(c => c.students.map(s => ({ ...s, classNumber: c.classNumber, className: c.className }))), [classes]);
  const schoolWide = useMemo(() => aggregateSchoolWide(classes), [classes]);
  const N = schoolWide?.studentCount || 130;
  
  const analyzed = useMemo(() => {
    if (!schoolWide) return null;
    return analyzeStudent(student, schoolWide.subjectScores, N);
  }, [student, schoolWide, N]);

  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (analyzed) {
      analyzed.subjectAnalysis.forEach(x => { if (x.grade !== null) s.add(x.subject); });
    }
    return s;
  });

  const handleSubjectToggle = (subj: string) => {
    const next = new Set(selectedSubjects);
    if (next.has(subj)) next.delete(subj);
    else next.add(subj);
    setSelectedSubjects(next);
  };

  if (!analyzed) return null;

  const validGrades = analyzed.subjectAnalysis.filter(x => x.grade !== null);
  const selectedGrades = validGrades.filter(x => selectedSubjects.has(x.subject));
  const weightedAvg = computeAvgGrade(validGrades, 'weighted');
  const simpleAvg = computeAvgGrade(validGrades, 'simple');
  const customWeightedAvg = computeAvgGrade(selectedGrades, 'weighted');
  const customSimpleAvg = computeAvgGrade(selectedGrades, 'simple');

  const allSums = allStudentsFlat.map(s => s.합계).filter(v => v !== null) as number[];
  const overallRank = student.합계 !== null ? getRank(student.합계, allSums) : null;
  const percentile = overallRank ? getPercentile(overallRank, N) : null;

  const sortedTable = [...analyzed.subjectAnalysis].sort((a, b) => {
    if (!sortState.col) return 0;
    const { col, dir } = sortState;
    const aVal = (a as any)[col];
    const bVal = (b as any)[col];
    if (aVal === bVal) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    const comp = aVal > bVal ? 1 : -1;
    return dir === 'asc' ? comp : -comp;
  });

  const toggleSort = (col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="flex min-h-screen lg:grid font-sans print:block" style={{ gridTemplateColumns: 'minmax(210px, 240px) 1fr' }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex print:hidden flex-col gap-4 border-r border-divider bg-surface px-3 py-4 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-divider pb-4 text-sm font-bold text-primary">
          <span>내신 분석기</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint">반</span>
          <div className="flex flex-wrap gap-1">
            {classes.map(cls => (
              <button
                key={cls.classNumber}
                className={`min-w-[40px] rounded-md px-2 py-1 text-xs font-semibold transition-all ${
                  classNum === cls.classNumber
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted border border-border hover:border-primary hover:bg-primary-light hover:text-primary'
                }`}
                onClick={() => {
                  const firstStudent = cls.students[0];
                  if(firstStudent) onChangeStudent(firstStudent, cls.classNumber);
                }}
              >
                {cls.className}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint" htmlFor="sidebar-student-select">
            학생
          </label>
          <select
            id="sidebar-student-select"
            className="w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 pr-8 text-xs text-text bg-no-repeat"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
            value={`${student.학번}_${student.성명}`}
            onChange={(e) => {
              const val = e.target.value;
              const found = allStudentsFlat.find(s => `${s.학번}_${s.성명}` === val);
              if(found && found.classNumber) onChangeStudent(found, found.classNumber);
            }}
          >
            {classes.find(c => c.classNumber === classNum)?.students.sort((a,b)=>a.번호-b.번호).map(s => (
              <option key={`${s.학번}_${s.성명}`} value={`${s.학번}_${s.성명}`}>
                {s.번호}번 {s.성명}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-auto flex flex-col gap-1">
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text-muted transition-all hover:bg-surface-offset hover:text-text" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            테마 전환
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text-muted transition-all hover:bg-surface-offset hover:text-text" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            파일 재업로드
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-bg p-4 lg:p-6 print:p-0 print:overflow-visible">
        <div className="mx-auto flex max-w-[920px] flex-col gap-5 print:max-w-none print:w-full print:gap-3">
          {/* Header Card */}
          <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-primary p-5 text-white shadow-lg lg:px-6 print:bg-white print:text-black print:border print:border-border print:shadow-none print:p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 p-1 print:hidden">
              <span className="text-base font-bold">칠원고</span>
            </div>
            <div className="min-w-[180px] flex-1">
              <div className="text-xl font-bold leading-tight">{student.성명}</div>
              <div className="mt-0.5 text-xs opacity-80 print:opacity-100">1학년 {classNum}반 {student.번호}번 · 학번 1{String(classNum).padStart(1, '0')}{String(student.번호).padStart(2, '0')}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium opacity-70 mb-1 tracking-wider uppercase print:opacity-100">이수단위 가중 평균등급</div>
              <div className="text-[2.8rem] font-bold leading-none tabular-nums font-mono tracking-tight print:text-[2rem]">
                {weightedAvg ?? '-'} <span className="text-base font-normal opacity-60 print:opacity-100">등급</span>
              </div>
              <div className="text-[11px] opacity-70 mt-2 bg-white/20 inline-block px-2 py-0.5 rounded-full print:bg-surface-offset print:opacity-100 print:text-text-muted">단순 평균 {simpleAvg ?? '-'}등급</div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-faint">학과 석차</div>
              <div className="mt-1 text-2xl font-bold tabular-nums font-mono text-primary">
                {overallRank ?? '-'} <span className="text-sm font-normal text-text-muted">/ {N}</span>
              </div>
              <div className="mt-2 text-[10px] text-text-muted font-bold">합계 기준</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-faint">평균 등급</div>
              <div className="mt-1 text-2xl font-bold tabular-nums font-mono text-primary">{weightedAvg ?? '-'}</div>
              <div className="mt-2 text-[10px] text-text-muted font-bold">이수단위 반영</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-faint">단순 평균</div>
              <div className="mt-1 text-2xl font-bold tabular-nums font-mono text-[var(--color-grade-3)]">{simpleAvg ?? '-'}</div>
              <div className="mt-2 text-[10px] text-text-muted font-bold">단순 산술 평균</div>
            </div>
            <div className="hidden lg:block rounded-2xl border border-border bg-surface p-5 shadow-sm">
               <div className="text-[11px] font-bold uppercase tracking-wider text-text-faint">상위 %</div>
               <div className="mt-1 text-2xl font-bold tabular-nums font-mono text-[var(--color-grade-4)]">{percentile ? `${percentile}%` : '-'}</div>
               <div className="mt-2 text-[10px] text-text-muted font-bold">합계 기준</div>
            </div>
          </div>

          {/* Average Selector */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:px-6 print:p-4 print:shadow-none">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm font-bold text-slate-800">과목 선택 별 등급 산출</div>
              <div className="flex gap-2 text-xs">
                <button
                  className={`rounded-full border px-3 py-1 font-semibold transition-all ${avgMode === 'weighted' ? 'border-primary bg-primary text-white print:bg-surface-offset print:text-text print:border-border' : 'border-border bg-surface-offset text-text-muted'}`}
                  onClick={() => setAvgMode('weighted')}
                >
                  이수단위 반영
                </button>
                <button
                  className={`rounded-full border px-3 py-1 font-semibold transition-all ${avgMode === 'simple' ? 'border-primary bg-primary text-white print:bg-surface-offset print:text-text print:border-border' : 'border-border bg-surface-offset text-text-muted'}`}
                  onClick={() => setAvgMode('simple')}
                >
                  단순 평균
                </button>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {validGrades.map(s => {
                const isActive = selectedSubjects.has(s.subject);
                return (
                  <button
                    key={s.subject}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${isActive ? 'border-primary bg-primary-light text-primary print:border-border print:text-text' : 'border-border bg-surface-offset text-text-muted'}`}
                    onClick={() => handleSubjectToggle(s.subject)}
                  >
                    {formatSubjectName(s.subject)} <span className="opacity-50">· {s.grade}등급</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-6 rounded-lg bg-surface-offset p-4 print:p-3">
               <div>
                 <div className="text-xs font-semibold text-text-muted">선택 평균 점수</div>
                 <div className={`mt-0.5 tabular-nums font-mono text-3xl font-bold ${avgMode === 'weighted' ? 'text-primary' : 'text-[var(--color-grade-3)]'}`}>
                   {avgMode === 'weighted' ? (customWeightedAvg ?? '-') : (customSimpleAvg ?? '-')}
                 </div>
                 <div className="text-xs text-text-muted">{selectedSubjects.size}과목 선택됨 / {avgMode === 'weighted' ? '이수단위 반영' : '단순 평균'}</div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-5 print:grid-cols-[1fr_250px] print:gap-3">
            {/* Subject Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2 lg:grid-cols-3 print:gap-2">
              {analyzed.subjectAnalysis.map(s => {
                const isNull = s.score === null;
                const progressPct = !isNull && s.gap && s.boundaries.length ? 100 - (100 * (s.schoolRank! - s.boundaries.find(b=>b.grade===s.grade!)!.maxRank + s.gap.rankGap) / Math.max(1, s.gap.rankGap * 2)) : 0; // rough approximation for progress bar. We'll just show bounded progress. Actually, maybe simple percentage based on raw score? The original didn't do simple percentage. It did width based on rank gap.
                
                return (
                  <div key={s.subject} className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md print:p-3 print:shadow-none">
                    <div className="mb-4 flex items-center justify-between print:mb-2">
                      <div className="text-sm font-bold">{formatSubjectName(s.subject)}</div>
                      <div className="rounded-md bg-primary-light px-2 py-0.5 text-[11px] font-bold text-primary print:bg-surface-offset">
                        {s.units}단위
                      </div>
                    </div>
                    {isNull ? (
                       <div className="flex flex-col items-center justify-center py-6 text-sm text-text-muted">
                         <span className="inline-flex rounded-full bg-surface-offset px-3 py-1 text-xs font-medium text-text-faint">응시하지 않음</span>
                       </div>
                    ) : (
                      <>
                        <div className="mb-3 grid grid-cols-3 gap-3 print:mb-2 print:gap-1">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-text-faint">원점수</div>
                            <div className="text-lg font-bold tabular-nums font-mono print:text-base">{s.score}</div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-text-faint">석차등급</div>
                            <div className="text-lg font-bold tabular-nums font-mono text-primary print:text-base">{s.grade}</div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-text-faint">전교등수</div>
                            <div className="text-lg font-bold tabular-nums font-mono print:text-base">{s.schoolRank}</div>
                            <div className="text-[10px] text-text-muted mb-1 print:hidden">/ {s.schoolN}명</div>
                          </div>
                        </div>
                        <div className="flex flex-col border-t border-divider pt-3 print:pt-2">
                          {s.gap && s.grade && s.grade > 1 ? (
                            <div className="w-full">
                              <div className="mb-1 text-[11px] text-text-muted font-bold">다음 등급({s.grade - 1}등급)까지 필요한 점수</div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-[var(--color-grade-3)] tabular-nums font-mono print:text-base">{s.gap.pointGap}점</span>
                                <span className="text-sm text-text-muted print:text-xs">(약 {s.gap.rankGap}등)</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full text-sm font-bold text-primary print:text-xs">
                              {s.grade === 1 ? '현재 최고 등급입니다.' : '데이터 없음'}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Radar Section */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:px-6 print:p-3 print:shadow-none">
              <div className="mb-4 text-sm font-bold text-slate-800">과목별 성취도 분석</div>
              <RadarChart subjectAnalysis={analyzed.subjectAnalysis} isDark={isDark} />
            </div>
          </div>

          {/* Table Section */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:px-6 mb-10 overflow-x-auto print:p-3 print:shadow-none print:mb-0">
             <table className="w-full min-w-[400px] border-collapse text-left font-sans">
               <thead>
                 <tr>
                   {['subject', 'units', 'score', 'grade', 'schoolRank', 'percentile'].map((key) => {
                     const titles: Record<string, string> = {
                       subject: '과목명', units: '단위', score: '원점수', grade: '등급', schoolRank: '석차', percentile: '백분위'
                     };
                     return (
                       <th 
                         key={key}
                         className="cursor-pointer border-b border-divider px-2 py-2 text-[11px] font-bold text-text-faint hover:text-text whitespace-nowrap print:py-1"
                         onClick={() => toggleSort(key)}
                       >
                         {titles[key]}
                         <span className={`ml-1 text-[10px] not-italic ${sortState.col === key ? 'text-primary opacity-100' : 'opacity-30'}`}>
                           {sortState.col === key ? (sortState.dir === 'asc' ? '▲' : '▼') : '↕'}
                         </span>
                       </th>
                     )
                   })}
                 </tr>
               </thead>
               <tbody>
                 {sortedTable.map((s) => (
                   <tr key={s.subject} className="hover:bg-surface-2 transition-colors">
                     <td className="border-b border-divider px-2 py-2 text-sm font-medium text-text print:py-1">{formatSubjectName(s.subject)}</td>
                     <td className="border-b border-divider px-2 py-2 text-sm print:py-1">{s.units}</td>
                     <td className="border-b border-divider px-2 py-2 text-sm tabular-nums font-mono print:py-1">{s.score ?? '-'}</td>
                     <td className="border-b border-divider px-2 py-2 text-sm tabular-nums font-mono print:py-1">
                       <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${s.grade !== null ? `bg-grade-${s.grade}-bg text-[var(--color-grade-${s.grade})]` : 'bg-surface-offset text-text-faint'} print:bg-transparent print:text-text print:p-0`}
                         style={{ backgroundColor: s.grade ? `var(--color-grade-${s.grade}-bg)` : undefined }}>
                         {s.grade ? `${s.grade}등급` : '-'}
                       </span>
                     </td>
                     <td className="border-b border-divider px-2 py-2 text-sm tabular-nums font-mono print:py-1">{s.schoolRank ?? '-'} <span className="opacity-50 text-[11px] font-sans">/ {N}</span></td>
                     <td className="border-b border-divider px-2 py-2 text-sm tabular-nums font-mono font-bold text-[var(--color-grade-1)] print:py-1">{s.percentile !== null ? `${s.percentile}%` : '-'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <div className="print-footer">출력일: {new Date().toLocaleDateString('ko-KR')} &nbsp;|&nbsp; 내신분석기</div>
        </div>
      </main>

      <button className="fixed bottom-6 right-6 z-[100] min-h-[44px] rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-hover lg:bottom-8 lg:right-8 print:hidden" onClick={() => window.print()}>
        🖨️ 인쇄
      </button>
    </div>
  );
}
