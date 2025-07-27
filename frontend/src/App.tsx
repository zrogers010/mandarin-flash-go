import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Vocabulary } from '@/pages/Vocabulary'
import { Quiz } from '@/pages/Quiz'
import { Dictionary } from '@/pages/Dictionary'
import { Chat } from '@/pages/Chat'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/dictionary" element={<Dictionary />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Layout>
  )
}

export default App 