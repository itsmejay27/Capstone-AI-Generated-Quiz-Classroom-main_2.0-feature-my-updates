import { createBrowserRouter } from 'react-router';
import RootLayout from './layouts/RootLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ClassroomDetail from './pages/ClassroomDetail';
import ExamGenerator from './pages/ExamGenerator';
import ExamRepository from './pages/ExamRepository';
import ReviewerGenerator from './pages/ReviewerGenerator';
import Reviewer from './pages/Reviewer';
import TakeExam from './pages/TakeExam';
import ExamResults from './pages/ExamResults';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: LoginPage },
      { path: 'dashboard', Component: Dashboard },
      { path: 'classroom/:classroomId', Component: ClassroomDetail },
      { path: 'exam-generator', Component: ExamGenerator },
      { path: 'exam-generator/:classroomId', Component: ExamGenerator },
      { path: 'exam-repository', Component: ExamRepository },
      { path: 'reviewer-generator', Component: ReviewerGenerator },
      { path: 'reviewer', Component: Reviewer },
      { path: 'exam/:examId/take', Component: TakeExam },
      { path: 'exam/:examId/results', Component: ExamResults },
    ],
  },
]);
