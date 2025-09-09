import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EntityProvider } from './contexts/EntityContext'
import { Layout } from './components/Layout'
import { Overview } from './pages/Overview'
import { Services } from './pages/Services'
import { Channels } from './pages/Channels'
import { DCX } from './pages/DCX'

function App() {
  return (
    <BrowserRouter>
      <EntityProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="services" element={<Services />} />
            <Route path="channels" element={<Channels />} />
            <Route path="dcx" element={<DCX />} />
          </Route>
        </Routes>
      </EntityProvider>
    </BrowserRouter>
  )
}

export default App
