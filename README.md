# Remix: 내신 분석기

고등학교 내신 성적 데이터를 업로드하여 시각화하고 분석할 수 있는 웹 어플리케이션입니다.

## 🚀 주요 기능
- **성적 데이터 파싱**: 엑셀 전적 데이터를 업로드하여 과목별 성적을 자동으로 분류합니다.
- **시각화 대시보드**: 레이더 차트와 분포 그래프를 통해 성적 추이를 한눈에 파악합니다.
- **학생별 분석**: 특정 학생의 등급 및 성취도를 상세하게 분석합니다.

## 🛠 기술 스택
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Animation**: Motion (Framer Motion)
- **Data Parsing**: XLSX

## 💻 로컬 개발 환경 설정

1. **저장소 클론** 또는 다운로드
2. **의존성 설치**
   ```bash
   npm install
   ```
3. **개발 서버 실행**
   ```bash
   npm run dev
   ```
4. 브라우저에서 `http://localhost:3000` 접속

## 📦 배포
Vercel, Netlify 또는 GitHub Pages를 통해 쉽게 배포할 수 있습니다.
```bash
npm run build
```
빌드 후 생성되는 `dist` 폴더의 내용을 정적 호스팅 서비스에 업로드하세요.
