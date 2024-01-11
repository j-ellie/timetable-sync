import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ChakraProvider, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react'
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider>
      <GoogleOAuthProvider clientId="603064467469-2u4rh86o1c9t3np5avphpalgv4ia71ql.apps.googleusercontent.com">
        <Alert status='info'>
          <AlertIcon />
          <AlertTitle>Merry Christmas!</AlertTitle>
          <AlertDescription>Timetable Sync is on a Christmas Break. Don't worry, we'll be back next semester, with some cool new changes too! Enjoy the time off college, see you soon :)</AlertDescription>
        </Alert>
        <App />
      </GoogleOAuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
