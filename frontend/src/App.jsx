import { useEffect, useState } from 'react'
import './App.css'
import { Center, Text, Image, Button, Heading, VStack } from '@chakra-ui/react'
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
          <>
            <VStack m={2}>
              <Heading>Timetable Sync</Heading>
              <Text mt={2}>The easy way to sync your DCU timetable on Google Calendar.</Text>
              <Text>To get started, just log in with Google using the button below and change the settings to your likings!</Text>
              <Image mt={3} mb={3} src="/demo.png" h="300px" borderRadius="1em" alt="Example of synced timetable." />
              <Button onClick={() => { login() }} isDisabled={true}>
                Sign in with Google
              </Button>
            </VStack>
          </>
        ) : null
      }
      
      </Center>
      <footer><Text textAlign="center" fontSize="sm">Timetable Sync is not affiliated with DCU. Made by <a href="https://jamesz.dev" target='_blank' style={{ textDecoration: "underline", fontWeight: "bold"}}>James</a></Text></footer>
    </>
  )
}

export default App
