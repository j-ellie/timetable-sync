import { useEffect, useState } from 'react'
import './App.css'
import { Center, Text, Button } from '@chakra-ui/react'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import SignedIn from './views/SignedIn';
import LoggingIn from './views/LoggingIn';
import Error from './views/Error';

function App() {
  const [signedIn, setSignIn] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(null);
  const [data, setData] = useState(null);

  const login = useGoogleLogin({
    onSuccess: codeResponse => {
      setLoading(true)
      fetch("https://api-ts.jamesz.dev/auth", {headers: {"code": codeResponse.code}, method: "POST"})
      .then(response => response.json())
      .then(data => {
        console.log("Logged In Successfully")
        setData(data.data)
        setSignIn(true)
        setLoading(false)
        console.log(data)
      })
      .catch(error => {
        setError(error.toString())
      })
    },
    flow: "auth-code",
    client_id: "603064467469-2u4rh86o1c9t3np5avphpalgv4ia71ql.apps.googleusercontent.com",
    access_type: "offline",
    redirect_uri: "https://tab.elliee.me/callback",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar"
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error") != null) {
      setError(params.get("error"))
    }
  }, [])
 
  return (
    <>
      <Center height="97vh">
      {
        isError != null ? (
          <Error error={isError} />
        ) : null
      } 

      {
        signedIn && !isLoading && isError == null ? (
          <SignedIn setSignIn={setSignIn} data={data} />   
        ) : null 
      }
      {
        isLoading && !signedIn && isError == null ? (
          <LoggingIn />   
        ) : null
      }

      {
        !isLoading && !signedIn && isError == null ? (
          <Button onClick={() => { login() }}>
            Sign in with Google
          </Button>
        ) : null
      }
      
      </Center>
      <footer><Text textAlign="center" fontSize="sm">Not affiliated with DCU.</Text></footer>
    </>
  )
}

export default App
