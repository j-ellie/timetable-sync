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
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  useColorMode,
  HStack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Tooltip,
  Checkbox, } from '@chakra-ui/react'
import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, SearchIcon } from "@chakra-ui/icons"
import { FaCheckCircle, FaExternalLinkAlt, FaExternalLinkSquareAlt, FaHome, FaStar } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";

import { fetchEventSource } from "@microsoft/fetch-event-source"

import convertToFriendly from '../utils/timeFormat';

export default function RoomSearch() {
  const apiEndpoint = import.meta.env.VITE_API_URL;
  const toast = useToast()

  const [roomMap, setRoomMap] = useState({});
  const [showRoomTypes, setShowRoomTypes] = useState(false);

  const [allRooms, setAllRooms] = useState([])

  // 0 = inputs for search
  // 1 = searching
  // 2 = showing search results
  // 3 = streaming results
  const [inputState, setInputState] = useState(0)
  const [searchResults, setResults] = useState(null)

  const [hideFavBtn, setHideFavBtn] = useState(false);


  const roomRef = useRef(null)
  const buildingRef = useRef(null)
  const filterRoomInput = useRef(null)


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

  const generateRoomMap = (rooms) => {
    if (roomMap.length === 0) return;
    const newRoomMap = {};

    rooms.forEach(room => {
        const [id, description] = room.split(" - ");  // Split room ID and description
        newRoomMap[id] = description;
    });
    
    return newRoomMap;
  }
  
  const getRoomDescription = (target) => {
    return roomMap[target] || "No Description";
  }

  const searchSpecific = () => {
    let selectedRoom = selected;
    if (!selected) {
      // the idea for this feature was given by Heather :)
      if (availableRooms.length === 1) {
        console.log("Auto choosing only option in search!")
        const room = availableRooms[0];
        roomRef.current.value = room;
        setSelected(room);
        selectedRoom = room;
      } else {
        toast({
          title: 'Please select a room from the dropdown!',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      }
    }
    console.warn("Searching...")
    setInputState(1)

    let targetTime;

    if (isToday === "true") {
      const now = new Date()
      // targetTime = now.toDateString() + " @ " + now.toTimeString().split(" ")[0];
      targetTime = now;
    } else if (isToday === "next") {
      const currentTime = new Date();
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentTime.getHours() + 1);
      targetTime = nextHour;
    } else {
      targetTime = new Date(selectedTime?.replace("@", ""))
    }

    fetch(apiEndpoint + `/room?room=${selectedRoom.split(" - ")[0]}&time=${targetTime.toUTCString()}`)
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

    setResults(null)

    let targetTime;

    if (isToday === "true") {
      const now = new Date()
      
      // targetTime = now.toDateString() + " @ " + now.toTimeString().split(" ")[0];
      targetTime = now
    } else if (isToday === "next") {
      const currentTime = new Date();
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentTime.getHours() + 1);
      targetTime = nextHour;
    } else {
      targetTime = new Date(selectedTime?.replace("@", ""))
    }
  

    let controller = new AbortController()

    try {
        await fetchEventSource(apiEndpoint + `/building/stream?building=${selected.split(" - ")[0]}&time=${targetTime.toUTCString()}`, {
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
                    toast({
                      title: 'Error from event stream..',
                      description: "The event stream triggered an error! Error: " + err.toString(),
                      status: 'error',
                      duration: 5000,
                      isClosable: true,
                    })
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
                    toast({
                      title: 'Failed to parse event..',
                      description: "Couldn't understand data from api. Error: " + err.toString(),
                      status: 'error',
                      duration: 5000,
                      isClosable: true,
                    })
                }
            },
        })
    } catch (e) {
        console.error('Error', e);
        toast({
          title: 'Unexpected error occurred..',
          description: "Couldn't get data from api. Error: " + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
    }
  }

  const reset = () => {
    setInputState(0)
    setResults(null)
    // setSelected(null)
  }

  const dates = generateDates()

  const [buildings, setBuildings] = useState([])
  const [availableRooms, setRooms] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedTime, setTime] = useState(null)

  const [favourites, setFavourites] = useState([]);

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
        // to prevent order from looking weird
        const reversedRooms = [...data.ids].reverse()
        setRooms(reversedRooms)
        setAllRooms(reversedRooms)
        const map = generateRoomMap(reversedRooms)
        setRoomMap(map);
        // load favorite rooms from cache
        loadFavourites();
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
    
    // targetTime = now.toDateString() + " @ " + now.toTimeString().split(" ")[0];
    targetTime = now
  } else if (isToday === "next") {
    const currentTime = new Date();
    const nextHour = new Date(currentTime);
    nextHour.setHours(currentTime.getHours() + 1);
    targetTime = nextHour;
  } else {
    targetTime = new Date(selectedTime?.replace("@", ""))
  }

  function refreshSelectedState(event) {
    if (event === 0) {
      setSelected(roomRef.current.value)
      setHideFavBtn(false);
    } else {
      setSelected(buildingRef.current.value)
      setHideFavBtn(true);
    }
    setInputState(0)
  }

  const filterRoomSelect = (e) => {
    setSelected(null);
    const value = e.target.value;

    let newFilter = [];

    if (!value || value === "") {
      setRooms(allRooms)
    } else {
      allRooms.forEach(r => {
        const isVisible = r.toLowerCase().includes(value.toLowerCase())
        if (isVisible) {
          newFilter.push(r)
        }
      })
      setRooms(newFilter)
      if (newFilter.length === 1) {
        setSelected(newFilter[0]);
      }
    }
  }

  // favourites system
  const loadFavourites = () => {
    const localFavourites = localStorage.getItem("rcFavourites");

    if (localFavourites) {
      setFavourites(JSON.parse(localFavourites))
    }
  }

  const favouriteRoom = () => {
    const curr = selected.split(" - ")[0];
    let updatedFavourites;
    if (!favourites?.includes(curr)) {
      if (favourites?.length > 4) {
        toast({
          title: 'Max Favourites Reached',
          description: "You've reached the maximum number of 4 favourites :(",
          status: 'warning',
          duration: 2000,
          isClosable: true,
          position: "top"
        })
        return;
      }
      updatedFavourites = favourites?.length === 0 ? [curr] : [...favourites, curr];
      setFavourites(updatedFavourites);
    } else {
      updatedFavourites = favourites.filter(f => f != curr);
      setFavourites(updatedFavourites);
    }
    localStorage.setItem("rcFavourites", JSON.stringify(updatedFavourites));
  }

  const handleFavouriteClick = (e) => {
    filterRoomInput.current.value = "";
    const roomId = e.target.childNodes[0].data;
    const description = getRoomDescription(roomId)
    const fullName = `${roomId} - ${description}`
    setSelected(fullName)
    setRooms(allRooms)
  }

  const openFullTimetable = () => {
    const url = "/viewer?room=" + selected
    window.open(url, '_blank').focus();
  }

  const {colorMode} = useColorMode();

  return (
    <Box bgColor={colorMode == "light" ? "gray.200" : "gray.700"} borderRadius="2em" width="30em" overflow="auto" p={3} pb={5} mt={10}>
      <Heading textAlign="center" fontSize="3xl">DCU Room Availability Checker</Heading>

      <Tabs onChange={refreshSelectedState}>
        <TabList>
          <Tab isDisabled={inputState === 3}>Check Specific Room</Tab>
          <Tab>Search a Building</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Box hidden={inputState !== 0}>
                <Input placeholder="Search for a Room" mb={1} size="sm" ref={filterRoomInput} onChange={filterRoomSelect} borderColor="gray.300"/>
                <Select variant="filled" placeholder='Select Room' cursor="pointer" onChange={makeSelection} value={selected} ref={roomRef}>
                  {availableRooms.map(r => (
                    <option value={r} key={r}>{r}</option>
                  ))}
                </Select>
                <HStack spacing={2} mt={1}>
                  {favourites?.map((fav) => (
                    <Tooltip key={fav} label={fav}>
                      <Tag variant='subtle' colorScheme='gray' cursor="pointer" onClick={handleFavouriteClick}>
                        <TagLeftIcon boxSize='12px' as={FaStar} />
                        <TagLabel>{fav}</TagLabel>
                      </Tag>
                    </Tooltip>
                  ))}
                </HStack>
                <RadioGroup onChange={setToday} value={isToday} mt={2}>
                  <Stack>
                    <Radio value="true" colorScheme='blue' borderColor="white">Right Now</Radio>
                    <Radio value="next" colorScheme='blue' borderColor="white">Next Hour</Radio>
                    <Radio value="false" colorScheme='blue' borderColor="white">Custom Date & Time</Radio>
                  </Stack>
                </RadioGroup>
                <Select variant="filled" placeholder='Select Timeframe' cursor="pointer" mt={2} size="sm" isDisabled={isToday !== "false"} onChange={selectTime}>
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
              <Box hidden={inputState !== 2}>
                <Text textAlign="center"><b>{selected}</b></Text>
                <Text mb={2} textAlign="center" color="gray.600"><b>{targetTime.toDateString() + " @ " + targetTime.toTimeString().split(" ")[0]}</b></Text>
                {
                  searchResults?.available ? (
                    <>
                    <Center>
                        <Icon as={FaCheckCircle} fontSize="9xl" color="green.400" />
                    </Center>
                    <Heading fontSize="xl" textAlign="center" mt={2} mb={1}>Room is Available</Heading>
                    {searchResults?.nextEvent?.description === "" ?
                      <Text textAlign="center">No events booked for the remainder of day.</Text>
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
                      <Text textAlign="center">No events booked for the remainder of day.</Text>
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
              {/* <Button colorScheme='purple' size="sm" w="100%" mt={4} onClick={reset}><SearchIcon mr={2} /> Search Again</Button> */}
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
                  <Radio value="true" colorScheme='blue' borderColor="white">Right Now</Radio>
                  <Radio value="next" colorScheme='blue' borderColor="white">Next Hour</Radio>
                  <Radio value="false" colorScheme='blue' borderColor="white">Custom Date & Time</Radio>
                </Stack>
              </RadioGroup>
              <Select variant="filled" placeholder='Select Timeframe' cursor="pointer" mt={2} size="sm" isDisabled={isToday !== "false"} onChange={selectTime} >
                {dates.map(date => (
                    <option value={date} key={date}>{date}</option>
                  ))}
              </Select>
              <Checkbox mt={1} onChange={(e) => {setShowRoomTypes(e.target.checked)}} borderColor="white">Show Room Types</Checkbox>
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
                <Text mb={2} textAlign="center" color="gray.600"><b>{targetTime.toDateString() + " @ " + targetTime.toTimeString().split(" ")[0]}</b></Text>
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
                        <Text>{searchResults?.length || 0}</Text>
                      </Center>
                    </Box>
                </Center>
                <Text textAlign="center" fontWeight="bold" color="gray.600" mt={1}>Rooms Available</Text>
                <TableContainer mt={2} overflowY="scroll" height="30vh">
                <Table variant='striped' colorScheme='teal' size="sm">
                  <Thead>
                    <Tr>
                      <Th>Room No.</Th>
                      <Th>Next Event</Th>
                      {
                        showRoomTypes ?
                        (
                          <Th>Room Type</Th>
                        ) : null
                      }
                    </Tr>
                  </Thead>
                  <Tbody>
                    {
                      Array.isArray(searchResults) &&
                      searchResults?.map(res => {
                        let nextEv;
                        if (new Date(res.nextEvent?.began).getFullYear() === 0) {
                          nextEv = "No events for the remainder of day."
                        } else {
                          nextEv = convertToFriendly(res.nextEvent?.began)
                        }

                        return (
                          <Tr key={res.id}>
                            <Td><a href={`/viewer?room=${res.id}`} target="_blank" rel="noopener noreferrer" className="roomlink">{res.id}</a></Td>
                            <Td>{nextEv}</Td>
                            {
                              showRoomTypes ?
                              (
                                <Td>{getRoomDescription(res.id)}</Td>
                              ) : null
                            }
                          </Tr>
                        )
                      }
                      )
                    }

                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <HStack>
        <Button colorScheme='teal' w="100%" onClick={backHome}><Icon as={FaHome} mr={2} /> Home</Button>
        <Button colorScheme='purple' w="100%" onClick={reset} isDisabled={inputState === 3} hidden={inputState !== 2 && inputState !== 3}><SearchIcon mr={2}/> Search Again</Button>
        <Tooltip label={favourites?.includes(selected?.split(" - ")[0]) ? 'Remove from favourites' : 'Add to favourites'}>
          <Button colorScheme={favourites?.includes(selected?.split(" - ")[0]) ? 'yellow' : 'gray'} w="20%" onClick={favouriteRoom} isDisabled={inputState === 3} hidden={inputState !== 2 && inputState !== 3 || hideFavBtn}><FaStar /></Button>
        </Tooltip>
        <Tooltip label="View Full Timetable">
          <Button colorScheme="orange" w="20%" onClick={openFullTimetable} isDisabled={inputState === 3} hidden={inputState !== 2 && inputState !== 3 || hideFavBtn}><FaExternalLinkAlt /></Button>
        </Tooltip>
      </HStack>
       
    </Box>
  )
}
