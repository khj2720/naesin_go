import React, { useState, useEffect } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { ClassScreen } from './components/ClassScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ClassData } from './lib/parser';

export default function App() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassNum, setSelectedClassNum] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  if (classes.length === 0) {
    return <UploadScreen onUpload={(data) => setClasses(data)} toggleTheme={toggleTheme} isDark={isDark} />;
  }

  if (!selectedStudent || selectedClassNum === null) {
    return (
      <ClassScreen 
        classes={classes} 
        onSelectStudent={(student, classNum) => {
          setSelectedClassNum(classNum);
          setSelectedStudent(student);
        }}
        onReset={() => setClasses([])}
        toggleTheme={toggleTheme}
        isDark={isDark}
      />
    );
  }

  return (
    <DashboardScreen 
      classes={classes}
      student={selectedStudent}
      classNum={selectedClassNum}
      onChangeStudent={(student, classNum) => {
        setSelectedStudent(student);
        setSelectedClassNum(classNum);
      }}
      onReset={() => {
        setClasses([]);
        setSelectedClassNum(null);
        setSelectedStudent(null);
      }}
      toggleTheme={toggleTheme}
      isDark={isDark}
    />
  );
}
