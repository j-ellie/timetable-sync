import { useEffect, useState } from 'react'
import './App.css'
import { Center, Text, Image, Button, Heading, VStack, Icon, OrderedList, UnorderedList, ListItem, Link, Alert, AlertTitle, AlertDescription, AlertIcon } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import SignedIn from './views/SignedIn';
import LoggingIn from './views/LoggingIn';
import Error from './views/Error';
import Privacy from './views/Privacy';
import RoomSearch from './views/RoomSearch';
import { FcGoogle } from "react-icons/fc";
import Footer from './components/Footer';
import GoogleSignin from './components/GoogleSignin';

function App() {
  const [signedIn, setSignIn] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [showPrivacy, setPrivacy] = useState(false);
  const [showRooms, setRooms] = useState(false);
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
    // redirect_uri: "https://tab.elliee.me/callback",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar"
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error") != null) {
      setError(params.get("error"))
    }

    if (window.location.pathname === "/privacy") {
      setPrivacy(true)
    } else if (window.location.pathname === "/room-checker") {
      setRooms(true)
    }
  }, [])
 
  return (
    <>
      <div className="wrapper">
      {
        showPrivacy ? (
          <Privacy />   
        ) : null 
      }
      {
        isError != null ? (
          <Center height={["auto", "100vh"]}>
            <Error error={isError} />
            {/* <Footer /> */}
          </Center>
        ) : null
      }
      {
        showRooms ? (
          // <Center height={["auto", "100vh"]}>
          <Center height="auto">
            <RoomSearch />   
            {/* <Footer /> */}
          </Center>
        ) : null 
      }
      {
        signedIn && !isLoading && isError == null && !showPrivacy && !showRooms ? (
          <Center height={["auto", "100vh"]}>
            <SignedIn setSignIn={setSignIn} data={data} /> 
            {/* <Footer /> */}
          </Center>
        ) : null 
      }
      {
        isLoading && !signedIn && isError == null && !showPrivacy && !showRooms ? (
          <Center height={["auto", "100vh"]}>
            <LoggingIn />
            {/* <Footer /> */}
          </Center>
        ) : null
      }

      {
        !isLoading && !signedIn && isError == null && !showPrivacy && !showRooms ? (
          <>
          <Alert status='warning'>
            <AlertIcon />
            <AlertTitle>Goodluck in your Exams!</AlertTitle>
            <AlertDescription>Semester 2 has come to an end, so Timetable Sync has gone on break. The <a href="/room-checker" style={{ textDecoration: "underline", fontWeight: "bold"}}>Room Availability Checker</a> is still up and working :)</AlertDescription>
          </Alert>
            <Center height="100vh">
            <VStack m={2}>
              <Heading>Timetable Sync</Heading>
              <Text mt={2}>The easy way to sync your DCU timetable on Google Calendar.</Text>
              <Text>To get started, just log in with Google using the button below and change the settings to your likings!</Text>
              <Image mt={3} mb={3} src="/demo.png" h="300px" borderRadius="1em" alt="Example of synced timetable." />
              <GoogleSignin registerClick={login}/>
              {/* <Button colorScheme="gray" onClick={() => { login() }} isDisabled={false}>
                <Icon as={FcGoogle} fontSize="3xl" mr={3} bgColor="white" p={1} borderRadius="50px" /> Sign in with Google
              </Button> */}
              <Button colorScheme="orange" onClick={() => { window.location.href = "/room-checker" }} isDisabled={false}>
                Room Checker
              </Button>

              <Link colorScheme="orange" href='#info'>
                <ChevronDownIcon fontSize="3xl" mt={2} />
              </Link>

              {/* <Footer /> */}
            </VStack>
            </Center>
            <Center m={2} id="info" mb={20}>
              <VStack w="3xl">
                <Heading>How it Works</Heading>
                <OrderedList>
                  <ListItem>Firstly log into Timetable Sync using your Google Account. Timetable Sync requires access to your Google Calendar to add and remove your timetabled events. This will bring you to the settings page.</ListItem>
                  <ListItem>Next, select your course from the dropdown, the majority of courses offered in Dublin City University are listed here.</ListItem>
                  <ListItem>Configure the rest of your settings to your desire including update frequency, email alerts, preferred name and ignored events.</ListItem>
                  <ListItem>Finally, press the save button and your preferences will be saved as well as your timetable will be synced for the first time.</ListItem>
                  <ListItem>Give it a couple of moments then check out your Google Calendar, it should be populated!</ListItem>
                </OrderedList>
                <UnorderedList>
                  <ListItem>At any time you can sync your timetable using the "Sync Now" button.</ListItem>
                  <ListItem>If you wish to stop using Timetable Sync, press the "Stop Syncing" button and all of your data will be deleted from the service immediately.</ListItem>
                  <ListItem>Have any questions? Email us at: <Link href="mailto:james@jamesz.dev">james@jamesz.dev</Link></ListItem>
                </UnorderedList>

                <Heading mt={2}>Features</Heading>
                <UnorderedList>
                  <ListItem>Fully automatic syncing, runs each morning so room changes, etc are updated.</ListItem>
                  <ListItem>Daily email notifications including your timetable for that day.</ListItem>
                  <ListItem>Error notifications if your timetable cannot be synced.</ListItem>
                  <ListItem>Colour-coded modules.</ListItem>
                  <ListItem>Add the names of events you don't want included on your timetable, e.g tutorial groups that aren't yours.</ListItem>
                  <ListItem>Built in, easy to use room checker, to find available rooms on campus.</ListItem>
                </UnorderedList>

              </VStack>
            </Center>
          </>
        ) : null
      }
      <Footer />
    </div>
    </>
  )
}

export default App
