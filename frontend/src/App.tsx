import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Home } from '@/pages/Home'
import { Vocabulary } from '@/pages/Vocabulary'
import { VocabularyDetail } from '@/pages/VocabularyDetail'
import { Quiz } from '@/pages/Quiz'
import { Dictionary } from '@/pages/Dictionary'
import { Chat } from '@/pages/Chat'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { VerifyEmail } from '@/pages/VerifyEmail'
import { Settings } from '@/pages/Settings'
import { Progress } from '@/pages/Progress'
import { PinyinChart } from '@/pages/PinyinChart'
import { HSKHub } from '@/pages/HSKHub'
import { Learn } from '@/pages/Learn'
import { Practice } from '@/pages/Practice'
import { Lessons } from '@/pages/Lessons'
import { LessonDetail } from '@/pages/LessonDetail'

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/vocabulary/:id" element={<VocabularyDetail />} />
          <Route path="/flashcards" element={<Quiz />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/pinyin" element={<PinyinChart />} />
          <Route path="/hsk" element={<HSKHub />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/grammar" element={<Lessons />} />
          <Route path="/lessons/topics" element={<Lessons />} />
          <Route path="/lessons/:slug" element={<LessonDetail />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
    </HelmetProvider>
  )
}

export default App