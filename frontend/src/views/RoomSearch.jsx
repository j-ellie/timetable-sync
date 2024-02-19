import { 
  Box, 
  Spinner, 
  Heading, 
  Tabs, 
  Tab, 
  TabList, 
  TabPanels, 
  TabPanel, 
  Radio, 
  RadioGroup, 
  Select, 
  Text, 
  Icon, 
  Button, 
  Center, 
  useToast, 
  Stack,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer, } from '@chakra-ui/react'
import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, SearchIcon } from "@chakra-ui/icons"
import { FaCheckCircle } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";

import { fetchEventSource } from "@microsoft/fetch-event-source"

import convertToFriendly from '../utils/timeFormat';

export default function RoomSearch() {
  // const apiEndpoint = "https://api-ts.jamesz.dev";
  const apiEndpoint = "http://localhost:1323";
  const toast = useToast()

  // 0 = inputs for search
  // 1 = searching
  // 2 = showing search results
  // 3 = streaming results
  const [inputState, setInputState] = useState(0)
  const [searchResults, setResults] = useState(null)


  const roomRef = useRef(null)
  const buildingRef = useRef(null)


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

  const searchSpecific = () => {
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

  const searchBuilding = async() => {
    if (!selected) {
      toast({
        title: 'Please select a building from the dropdown!',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setInputState(1)

    let targetTime;

    if (isToday === "true") {
      const now = new Date()
      targetTime = now.toDateString() + " @ " + now.toTimeString().split(" ")[0];
    } else {
      targetTime = selectedTime
    }

    let controller = new AbortController()

    try {
        await fetchEventSource(apiEndpoint + `/building/stream?building=${selected.split(" - ")[0]}&time=${targetTime}`, {
            method: 'GET',
            headers: {},
            signal: controller.signal,

            onopen: async (res) => {
                const contentType = res.headers.get('content-type');

                if (!!contentType && contentType.indexOf('application/json') >= 0) {
                    throw await res.json();
                }
            },
            onerror: (e) => {
                if (!!e) {
                    console.log('Fetch onerror', e);
                    // do something with this error
                }

                controller.abort();

                throw e;
            },
            onmessage: async (ev) => {
                console.log("data received.")
                if (ev.event === "end") {
                  console.log("transmission finished.")
                  setInputState(2)
                  controller.abort();
                  return
                }
                const data = ev.data;

                if (!data) {
                    return;
                }

                try {
                    const d = JSON.parse(data);

                    setResults(prev => {
                      if (!prev) {
                        let newArr = []
                        newArr.push(d)
                        return newArr
                      } else {
                        return prev.concat(d)
                      }
                    })
                    setInputState(3)


                } catch (e) {
                    console.log('Fetch onmessage error', e);
                }
            },
        })
    } catch (e) {
        console.log('Error', e);
    }

  //   fetch(apiEndpoint + `/building?building=${selected.split(" - ")[0]}&time=${targetTime}`)
  //   .then(response => {
  //     // Get the readable stream from the response body
  //     const stream = response.body;
  //     // Get the reader from the stream
  //     const reader = stream.getReader();
  //     // Define a function to read each chunk
  //     const readChunk = () => {
  //         // Read a chunk from the reader
  //         reader.read()
  //             .then(({
  //                 value,
  //                 done
  //             }) => {
  //                 // Check if the stream is done
  //                 if (done) {
  //                     // Log a message
  //                     console.log('Stream finished');
  //                     // Return from the function
  //                     return;
  //                 }
  //                 // Convert the chunk value to a string
  //                 const chunkString = new TextDecoder().decode(value);
  //                 // Log the chunk string
  //                 console.log(chunkString);
  //                 // Read the next chunk
  //                 readChunk();
  //             })
  //             .catch(error => {
  //                 // Log the error
  //                 console.error(error);
  //             });
  //     };
  //     // Start reading the first chunk
  //     readChunk();
  // })
  // .catch(error => {
  //     // Log the error
  //     console.error(error);
  // });
  //   .then(response => response.json())
  //   .then(data => {
  //     if (!data.success) {
  //       toast({
  //         title: 'Failed to preform request..',
  //         description: "Couldn't get data from api. Error: " + err.toString(),
  //         status: 'error',
  //         duration: 5000,
  //         isClosable: true,
  //       })
  //       return;
  //     } else {
  //       console.log("RESPONSE ")
  //       console.log(data)
  //       setResults(data.data)
  //       setInputState(2)
  //     }
  //   })
  //   .catch(err => {
  //     toast({
  //       title: 'Failed to preform request..',
  //       description: "Couldn't get data from api. Error: " + err.toString(),
  //       status: 'error',
  //       duration: 5000,
  //       isClosable: true,
  //     })
  //   })
  }

  const reset = () => {
    setInputState(0)
    setResults(null)
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

  let targetTime;

  if (isToday === "true") {
    const now = new Date()
    targetTime = now.toDateString() + " @ " + now.toTimeString().split(" ")[0];
  } else {
    targetTime = selectedTime
  }

  function refreshSelectedState(event) {
    if (event === 0) {
      setSelected(roomRef.current.value)
    } else {
      setSelected(buildingRef.current.value)
    }
    setInputState(0)
  }


  return (
    <Box bgColor="gray.200" borderRadius="2em" width="30em" overflow="auto" p={3} pb={5}>
      <Heading textAlign="center" fontSize="3xl">DCU Room Availability Checker</Heading>

      <Tabs onChange={refreshSelectedState}>
        <TabList>
          <Tab>Check Specific Room</Tab>
          <Tab>Search a Building</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Box hidden={inputState !== 0}>
                <Select variant="filled" placeholder='Select Room' cursor="pointer" onChange={makeSelection} ref={roomRef}>
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
                <Button colorScheme='green' w="100%" mt={4} onClick={searchSpecific}><SearchIcon mr={2} /> Search</Button>
              </Box>
              <Stack direction="column" hidden={inputState !== 1}>
                <Center>
                  <Spinner />
                </Center>
                <Text textAlign="center">Searching... Please wait a moment :)</Text>
              </Stack>
              {/* TODO: Add until text (free until, occupied until) */}
              <Box hidden={inputState !== 2}>
                <Text textAlign="center"><b>{selected}</b></Text>
                <Text mb={2} textAlign="center" color="gray.600"><b>{targetTime}</b></Text>
                {
                  searchResults?.available ? (
                    <>
                    <Center>
                        <Icon as={FaCheckCircle} fontSize="9xl" color="green.400" />
                    </Center>
                    <Heading fontSize="xl" textAlign="center" mt={2} mb={1}>Room is Available</Heading>
                    {searchResults?.nextEvent?.description === "" ?
                      <Text>No events booked for the remainder of today.</Text>
                      : (
                        <>
                        {/* <Text><b>Free Until:</b> {searchResults?.until}</Text> */}
                        <Heading fontSize="lg" textAlign="center" mt={2} mb={1}>Next Event</Heading>
                        <Text><b>Begins:</b> {convertToFriendly(searchResults?.nextEvent?.began)}</Text>
                        <Text><b>Description:</b> {searchResults?.nextEvent?.description}</Text>
                        <Text><b>Module:</b> {searchResults?.nextEvent?.module}</Text>
                        <Text><b>Ends:</b> {convertToFriendly(searchResults?.nextEvent?.ends)}</Text>
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
                    {/* <Text><b>Until:</b> {searchResults?.until}</Text> */}
                    
                    <Heading fontSize="lg" textAlign="center" mt={2} mb={1}>Current Event</Heading>
                    <Text><b>Began:</b> {convertToFriendly(searchResults?.occupiedBy?.began)}</Text>
                    <Text><b>Description:</b> {searchResults?.occupiedBy?.description}</Text>
                    <Text><b>Module:</b> {searchResults?.occupiedBy?.module}</Text>
                    <Text><b>Ends:</b> {convertToFriendly(searchResults?.occupiedBy?.ends)}</Text>

                    <Heading fontSize="lg" textAlign="center" mt={2} mb={1}>Next Event</Heading>
                    {searchResults?.nextEvent?.description === "" ?
                      <Text>No events booked for the remainder of today.</Text>
                      : (
                        <>
                        <Text><b>Begins:</b> {convertToFriendly(searchResults?.nextEvent?.began)}</Text>
                        <Text><b>Description:</b> {searchResults?.nextEvent?.description}</Text>
                        <Text><b>Module:</b> {searchResults?.nextEvent?.module}</Text>
                        <Text><b>Ends:</b> {convertToFriendly(searchResults?.nextEvent?.ends)}</Text>
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
              <Select variant="filled" placeholder='Select Building' cursor="pointer" onChange={makeSelection} ref={buildingRef}>
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
              <Button colorScheme='green' w="100%" mt={4} onClick={searchBuilding}><SearchIcon mr={2} /> Search</Button>
            </Box>
            <Stack direction="column" hidden={inputState !== 1 && inputState !== 3}>
              <Center>
                <Spinner />
              </Center>
              <Text textAlign="center">Searching... Please wait a moment :)</Text>
            </Stack>
            
            <Box hidden={inputState !== 2 && inputState !== 3}>
                <Text textAlign="center"><b>{selected}</b></Text>
                <Text mb={2} textAlign="center" color="gray.600"><b>{targetTime}</b></Text>
                <Center>
                    <Box
                      bgColor="blue.500"
                      h="100px"
                      w="100px"
                      borderRadius="50%"
                      textAlign="center"
                      color="white"
                      fontWeight="bold"
                      fontSize="6xl"
                      pb={2}
                    >
                      <Center h="100%">
                        <Text>{searchResults?.length}</Text>
                      </Center>
                    </Box>
                </Center>
                <Text textAlign="center" fontWeight="bold" color="gray.600" mt={1}>Rooms Available</Text>
                {/* TODO maybe put this info into a striped table */}
                <TableContainer mt={2}>
                <Table variant='striped' colorScheme='teal' size="sm">
                  <TableCaption>Showing available Rooms</TableCaption>
                  <Thead>
                    <Tr>
                      <Th>Room No.</Th>
                      <Th>Next Event</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {
                      Array.isArray(searchResults) &&
                      searchResults?.map(res => {
                        let nextEv;
                        if (new Date(res.nextEvent?.began).getFullYear() === 0) {
                          nextEv = "No events for the remainder of today."
                        } else {
                          nextEv = convertToFriendly(res.nextEvent?.began)
                        }

                        return (
                          <Tr key={res.id}>
                            <Td>{res.id}</Td>
                            <Td>{nextEv}</Td>
                          </Tr>
                          // <Text key={res.id}>{res.id} - {nextEv}</Text>
                        )

                      }
                      )
                    }

                  </Tbody>
                </Table>
              </TableContainer>
                {/* {
                  Array.isArray(searchResults) &&
                  searchResults?.map(res => {
                    let nextEv;
                    if (new Date(res.nextEvent?.began).getFullYear() === 0) {
                      nextEv = "No events for the remainder of today."
                    } else {
                      nextEv = "Next Event @ " + convertToFriendly(res.nextEvent?.began)
                    }

                    return (
                      <Text key={res.id}>{res.id} - {nextEv}</Text>
                    )

                  }
                  )
                } */}

              <Button colorScheme='purple' size="sm" w="100%" mt={4} onClick={reset}><SearchIcon mr={2} /> Search Again</Button>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
       
      <Button colorScheme='teal' w="100%" mt={4} onClick={backHome}><ArrowLeftIcon mr={4} /> Back Home</Button>
    </Box>
  )
}
