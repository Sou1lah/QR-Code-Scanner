import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { App } from '@/app/App'
import { PhonePreview } from '@/components/dev/PhonePreview'
import '@/styles.css'

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PhonePreview>
        <App />
      </PhonePreview>
    </BrowserRouter>
  </React.StrictMode>,
)
