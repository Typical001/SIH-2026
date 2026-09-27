import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CaptainLogin from './components/CaptainLogin.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CaptainLogin><App /></CaptainLogin>
  </React.StrictMode>,
)
