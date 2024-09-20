import { createSignal, Show, onCleanup } from 'solid-js'
import { createEvent } from './supabaseClient'
import { SolidMarkdown } from 'solid-markdown'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun } from 'docx'

function App() {
  const [query, setQuery] = createSignal('')
  const [response, setResponse] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')
  const [showOptions, setShowOptions] = createSignal(false)

  let inputRef

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading()) return
    setLoading(true)
    setError('')
    setResponse('')
    setShowOptions(false)
    try {
      const result = await createEvent('chatgpt_request', {
        prompt: `Provide a detailed report to help resolve the following UK employment law query, referring to applicable legislation and best practices:\n\n${query()}`,
        response_type: 'text'
      })
      if (result) {
        setResponse(result)
        setShowOptions(true)
      } else {
        setError('An error occurred while fetching the response.')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while fetching the response.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportWord = async () => {
    if (!response()) return
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: response()
                .split('\n')
                .map(line => new TextRun({ text: line, break: 1 })),
            }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, 'UK_Employment_Law_Advice.docx')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'UK Employment Law Advice',
        text: response(),
      })
    } else {
      alert('Web Share API is not supported in your browser.')
    }
  }

  const handleAskAnother = () => {
    setQuery('')
    setResponse('')
    setShowOptions(false)
    inputRef.focus()
  }

  return (
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <div class="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
        <h1 class="text-3xl font-bold mb-6 text-center">UK Employment Law Advice</h1>
        <Show when={!response()} fallback={
          <div>
            <div class="prose max-w-none mb-6">
              <SolidMarkdown children={response()} />
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-around items-center mb-6">
              <button
                class="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer mb-4 sm:mb-0 sm:mr-2"
                onClick={handleShare}
              >
                Share Report
              </button>
              <button
                class="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer mb-4 sm:mb-0 sm:mr-2"
                onClick={handleExportWord}
              >
                Export to MS Word
              </button>
              <button
                class="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer mb-4 sm:mb-0 sm:mr-2"
                onClick={handleAskAnother}
              >
                Ask Another Question
              </button>
              <button
                class="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                onClick={() => window.close()}
              >
                Quit App
              </button>
            </div>
          </div>
        }>
          <form onSubmit={handleSubmit} class="flex flex-col">
            <label for="query" class="mb-2 font-semibold">Please explain your employment law query:</label>
            <textarea
              id="query"
              ref={inputRef}
              class="box-border w-full h-32 p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
              value={query()}
              onInput={(e) => setQuery(e.target.value)}
              required
            ></textarea>
            <Show when={error()}>
              <p class="text-red-500 mb-4">{error()}</p>
            </Show>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading()}
            >
              <Show when={loading()} fallback="Submit Query">
                Loading...
              </Show>
            </button>
          </form>
        </Show>
      </div>
    </div>
  )
}

export default App