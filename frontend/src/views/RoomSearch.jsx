import { Box, Spinner, Heading, Tabs, Tab, TabList, TabPanels, TabPanel, Radio, RadioGroup, Select, Text, ListItem, Icon, Tooltip, Button, Link, Input, Avatar, Center, useToast, InputGroup, InputRightElement, HStack, Stack, UnorderedList } from '@chakra-ui/react'
import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, SearchIcon } from "@chakra-ui/icons"
import { FaCheckCircle } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";

import ago from "s-ago"

export default function RoomSearch() {
  // const apiEndpoint = "https://api-ts.jamesz.dev";
  const apiEndpoint = "http://localhost:1323";
  const toast = useToast()

  // 0 = inputs for search
  // 1 = searching
  // 2 = showing search results
  const [inputState, setInputState] = useState(0)
  const [searchResults, setResults] = useState(null)

  const [isToday, setToday] = useState("true");

  // https://stackoverflow.com/questions/7293306/how-to-round-to-nearest-hour-using-javascript-date-object
  function roundMinutes(date) {
    date.setHours(date.getHours() + Math.round(date.getMinutes()/60));
    date.setMinutes(0, 0, 0); // Resets also seconds and milliseconds

    return date;
  }

  const generateDates = () => {
    let returnables = [];
    const rightNow = roundMinutes(new Date());
    returnables.push(rightNow.toDateString() + " @ " + rightNow.toTimeString().split(" ")[0]);

    for (let index = 0; index < 100; index++) {
      rightNow.setHours(rightNow.getHours() + 1);
      returnables.push(rightNow.toDateString() + " @ " + rightNow.toTimeString().split(" ")[0]);
    }
    return returnables
  }

  const backHome = () => {
    window.location.href = "/"
  }

  const makeSelection = (e) => {
    setSelected(e.target.value)
  }	

  const selectTime = (e) => {
    setTime(e.target.value)
  }	

  const search = () => {
    if (!selected) {
      toast({
        title: 'Please select a room from the dropdown!',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }
    console.log(selected)
    console.warn("Searching...")
    setInputState(1)

    let targetTime;

    if (isToday === "true") {
      const now = new Date()
      targetTime = now.toDateString() + " @ " + now.toTimeString().split(" ")[0];
    } else {
      targetTime = selectedTime
    }

    fetch(apiEndpoint + `/room?room=${selected.split(" - ")[0]}&time=${targetTime}`)
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        toast({
          title: 'Failed to preform request..',
          description: "Couldn't get data from api. Error: " + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      } else {
        console.log("RESPONSE ")
        console.log(data)
        setResults(data.data)
        setInputState(2)
      }
    })
    .catch(err => {
      toast({
        title: 'Failed to preform request..',
        description: "Couldn't get data from api. Error: " + err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }

  const reset = () => {
    setInputState(0)
  }

  const dates = generateDates()

  const [buildings, setBuildings] = useState([])
  const [availableRooms, setRooms] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedTime, setTime] = useState(null)

  useEffect(() => {
    if (availableRooms.length !== 0) return;
    console.log(">> Fetching Rooms...")
    fetch(apiEndpoint + "/rooms")
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        toast({
          title: 'Failed to fetch rooms.',
          description: "Couldn't get rooms from api. Error: " + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      } else {
        setRooms([])
        setRooms(data.ids)
      }
    })
    .catch(err => {
      toast({
        title: 'Failed to fetch rooms.',
        description: "Couldn't get rooms from api. Error: " + err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })

    console.log(">> Fetching Buildings...")
    fetch(apiEndpoint + "/buildings")
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        toast({
          title: 'Failed to fetch buildings.',
          description: "Couldn't get buildings from api. Error: " + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      } else {
        setBuildings([])
        setBuildings(data.ids)
      }
    })
    .catch(err => {
      toast({
        title: 'Failed to fetch buildings.',
        description: "Couldn't get buildings from api. Error: " + err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }, [])

  return (
    <Box bgColor="gray.200" borderRadius="2em" width="30em" height="em" p={3} pb={5} maxHeight="95vh">
      <Heading textAlign="center" fontSize="3xl">DCU Room Availability Checker</Heading>

      <Tabs onChange={() => { setInputState(0) }}>
        <TabList>
          <Tab>Check Specific Room</Tab>
          <Tab>Search a Building</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Box hidden={inputState !== 0}>
                <Select variant="filled" placeholder='Select Room' cursor="pointer" onChange={makeSelection}>
                  {availableRooms.map(r => (
                    <option value={r} key={r}>{r}</option>
                  ))}
                </Select>
                <RadioGroup onChange={setToday} value={isToday} mt={2}>
                  <Stack>
                    <Radio value="true" colorScheme='blue'>Right Now</Radio>
                    <Radio value="false" colorScheme='blue'>Custom Date & Time</Radio>
                  </Stack>
                </RadioGroup>
                <Select variant="filled" placeholder='Select Timeframe' cursor="pointer" mt={2} size="sm" isDisabled={isToday === "true"} onChange={selectTime}>
                  {dates.map(date => (
                      <option value={date} key={date}>{date}</option>
                    ))}
                </Select>
                <Button colorScheme='green' w="100%" mt={4} onClick={search}><SearchIcon mr={2} /> Search</Button>
              </Box>
              <Stack direction="column" hidden={inputState !== 1}>
                <Center>
                  <Spinner />
                </Center>
                <Text textAlign="center">Searching... Please wait a moment :)</Text>
              </Stack>
              {/* TODO: Add friendly times here (e.g in 2 hours) */}
              <Box hidden={inputState !== 2}>
                {
                  searchResults?.available ? (
                    <>
                    <Center>
                        <Icon as={FaCheckCircle} fontSize="9xl" color="green.400" />
                    </Center>
                    <Heading fontSize="xl" textAlign="center" mt={2} mb={1}>Room is Available</Heading>
                    {searchResults?.nextEvent.description === "" ?
                      <Text>No events booked for the remainder of today.</Text>
                      : (
                        <>
                        <Text><b>Free Until:</b> {searchResults?.until}</Text>
                        <Heading fontSize="lg" textAlign="center" mt={2} mb={1}>Next Event</Heading>
                        <Text><b>Begins:</b> {searchResults?.nextEvent.began}</Text>
                        <Text><b>Description:</b> {searchResults?.nextEvent.description}</Text>
                        <Text><b>Module:</b> {searchResults?.nextEvent.module}</Text>
                        <Text><b>Ends:</b> {searchResults?.nextEvent.ends}</Text>
                        </>
                      )
                    }

                    </>
                  ) : (
                    <>
                    <Center>
                        <Icon as={FaCircleXmark} fontSize="9xl" color="red.500" />
                    </Center>
                    <Heading fontSize="xl" textAlign="center" mt={2} mb={1}>Room is Occupied</Heading>
                    <Text><b>Until:</b> {searchResults?.until}</Text>
                    
                    <Heading fontSize="lg" textAlign="center" mt={2} mb={1}>Current Event</Heading>
                    <Text><b>Began:</b> {new Date(searchResults?.occupiedBy.began).toLocaleString()} ({ago(new Date(searchResults?.occupiedBy.began))})</Text>
                    <Text><b>Description:</b> {searchResults?.occupiedBy.description}</Text>
                    <Text><b>Module:</b> {searchResults?.occupiedBy.module}</Text>
                    <Text><b>Ends:</b> {searchResults?.occupiedBy.ends}</Text>

                    <Heading fontSize="lg" textAlign="center" mt={2} mb={1}>Next Event</Heading>
                    {searchResults?.nextEvent.description === "" ?
                      <Text>No events booked for the remainder of today.</Text>
                      : (
                        <>
                        <Text><b>Begins:</b> {searchResults?.nextEvent.began}</Text>
                        <Text><b>Description:</b> {searchResults?.nextEvent.description}</Text>
                        <Text><b>Module:</b> {searchResults?.nextEvent.module}</Text>
                        <Text><b>Ends:</b> {searchResults?.nextEvent.ends}</Text>
                        </>
                      )
                    }
                    </>
                  )
                }
              <Button colorScheme='purple' size="sm" w="100%" mt={4} onClick={reset}><SearchIcon mr={2} /> Search Again</Button>
            </Box>
          </TabPanel>
          <TabPanel>
            <Box hidden={inputState !== 0}>
              <Select variant="filled" placeholder='Select Building' cursor="pointer" onChange={makeSelection}>
                {buildings.map(building => (
                  <option value={building} key={building}>{building}</option>
                ))}
              </Select>
              <Text fontSize="xs" mt={1} mb={1} color="gray.600">Only some buildings are shown here. Didn't find what you are looking for? Use the "Check Specific Room" function instead.</Text>
              <RadioGroup onChange={setToday} value={isToday} mt={2}>
                <Stack>
                  <Radio value="true" colorScheme='blue'>Right Now</Radio>
                  <Radio value="false" colorScheme='blue'>Custom Date & Time</Radio>
                </Stack>
              </RadioGroup>
              <Select variant="filled" placeholder='Select Timeframe' cursor="pointer" mt={2} size="sm" isDisabled={isToday === "true"} onChange={selectTime} >
                {dates.map(date => (
                    <option value={date} key={date}>{date}</option>
                  ))}
              </Select>
              <Button colorScheme='green' w="100%" mt={4} onClick={search}><SearchIcon mr={2} /> Search</Button>
            </Box>
            <Stack direction="column" hidden={inputState !== 1}>
              <Center>
                <Spinner />
              </Center>
              <Text textAlign="center">Searching... Please wait a moment :)</Text>
            </Stack>
            
            {/* <Box hidden={inputState !== 2}>
              <Heading fontSize="md" textAlign="center" mb={1}>Search Results</Heading>
              <Center>
                  <Icon as={FcApproval} />
              </Center>
              <UnorderedList >
                <ListItem>Room #1 - FREE until x</ListItem>
                <ListItem>Room #2 - FREE until x</ListItem>
                <ListItem>Room #3 - FREE until x</ListItem>
                <ListItem>Room #4 - FREE until x</ListItem>
                <Button colorScheme='purple' size="sm" w="100%" mt={4} onClick={reset}><SearchIcon mr={2} /> Search Again</Button>
              </UnorderedList>
            </Box> */}
          </TabPanel>
        </TabPanels>
      </Tabs>
       
      <Button colorScheme='teal' w="100%" mt={4} onClick={backHome}><ArrowLeftIcon mr={4} /> Back Home</Button>
    </Box>
  )
}
