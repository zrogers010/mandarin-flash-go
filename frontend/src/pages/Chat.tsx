import { Bot, MessageCircle, Sparkles } from 'lucide-react'

export function Chat() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] max-w-2xl mx-auto px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
          <Bot className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">AI Chinese Tutor</h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Coming Soon
        </div>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          Practice Chinese conversation with an AI tutor that can help with vocabulary, grammar, pronunciation, and more.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-10">
          {[
            { icon: MessageCircle, title: 'Conversation Practice', desc: 'Chat in Chinese with real-time feedback' },
            { icon: Sparkles, title: 'Grammar Help', desc: 'Get explanations of tricky grammar points' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-left"
            >
              <feature.icon className="w-5 h-5 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900 text-sm">{feature.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400">
          In the meantime, try the <a href="/flashcards" className="text-primary-600 hover:text-primary-700 font-medium">flashcards</a> or browse the <a href="/dictionary" className="text-primary-600 hover:text-primary-700 font-medium">dictionary</a> to study vocabulary.
        </p>
      </div>
    </div>
  )
}
