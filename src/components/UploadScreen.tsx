import React, { useState } from 'react';
import { UploadCloud, Loader2, Moon, Sun } from 'lucide-react';
import { ClassData, parseFile } from '../lib/parser';

interface UploadScreenProps {
  onUpload: (classes: ClassData[]) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export function UploadScreen({ onUpload, toggleTheme, isDark }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.endsWith('.xlsx')) {
      setError('xlsx 파일만 업로드 가능합니다');
      return;
    }
    setLoading(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const classes = parseFile(arrayBuffer);
      if (!classes || !classes.length) {
        setError('파일 형식을 인식하지 못했습니다. 나이스 지필평가 학급별 일람표 파일인지 확인해주세요');
        setLoading(false);
        return;
      }
      onUpload(classes);
    } catch (err: any) {
      setError('파일 파싱 중 오류가 발생했습니다: ' + err.message);
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-20 flex min-h-[52px] items-center justify-between border-b border-divider bg-surface px-6 py-2">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <span>내신 분석기</span>
        </div>
        <button className="btn-icon" onClick={toggleTheme} aria-label="다크모드 전환">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center justify-center gap-5 px-4 py-8">
        <div className="animate-bounce" aria-hidden="true">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light text-primary">
            <UploadCloud className="h-12 w-12" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-primary">내신 분석기</h1>
        <p className="text-center text-sm text-text-muted">학교 지필평가 학급별 일람표 분석</p>
        
        <div className="flex items-center gap-2 rounded-full bg-primary-light px-4 py-2 text-xs font-medium text-primary">
          📁 파일은 브라우저에서만 처리되며 서버에 전송되지 않습니다
        </div>

        <label
          className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all ${
            isDragging ? 'border-primary bg-primary-light' : 'border-border bg-surface hover:border-primary hover:bg-primary-light'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <UploadCloud className="h-10 w-10 text-text-muted" strokeWidth={1.5} />
          <p className="text-sm text-text-muted">여기에 파일을 끌어다 놓거나</p>
          <span className="btn btn-primary pointer-events-none">파일 선택</span>
          <input 
            type="file" 
            accept=".xlsx" 
            className="sr-only" 
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <p className="!text-xs !text-text-faint">나이스 지필평가 학급별 일람표 .xlsx</p>
        </label>

        {error && (
          <div className="w-full rounded-md bg-grade-5-bg px-4 py-3 text-center text-sm text-grade-5" role="alert">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>파일 분석 중...</span>
          </div>
        )}
      </div>
    </div>
  );
}
