import { Box, Text, Heading, Select, FormLabel, Switch, FormControl, Tooltip, Button, Link, Input, Avatar, Center, useToast, InputGroup, InputRightElement, HStack, useDisclosure, useColorMode } from '@chakra-ui/react'
import React, { useState, useEffect, useRef } from 'react'
import { QuestionIcon } from "@chakra-ui/icons"
import { googleLogout } from '@react-oauth/google'
import DeleteAccount from '../components/DeleteAccount'
import Admin from '../components/Admin'

export default function LoggingIn({ setSignIn, data }) {
  const apiEndpoint = import.meta.env.VITE_API_URL;
  const toast = useToast()
  const [processing, setProcessing] = useState(false)
  const [availableCourses, setCourses] = useState([]) 
  const ignoreInput = useRef(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [loadedCourses, setLoadedCourses] = useState(false)

  const [localIgnores, setLocalIgnores] = useState([])

  const { isOpen, onOpen, onClose } = useDisclosure()


  useEffect(() => {
    if (loadedCourses) return;
    fetch(apiEndpoint + "/courses")
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        toast({
          title: 'Failed to fetch courses.',
          description: "Couldn't get courses from api. Error:" + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      } else {
        setCourses([])
        setCourses(data.ids)
        setLoadedCourses(true)
      }
    })
    .catch(err => {
      toast({
        title: 'Failed to fetch courses.',
        description: "Couldn't get courses from api. Error:" + err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }, [])

  useEffect(() => {
    if (!data) return;

    setLocalIgnores(data.data.ignore_events)
  }, [data]);

  const logout = () => {
    googleLogout()
    setSignIn(false)
  }

  if (data == null) {
    window.location.href = "/?error=no-data"
  }

  const [formData, setFormData] = useState(data.data)

  const save = () => {
    // console.log(formData)
    if (formData.course_code === "" || formData.sync_time === "" || formData.name === "") {
      toast({
        title: 'Missing required details.',
        description: "Some of the required inputs seem to be empty.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return;
    }
    setProcessing(true)
    toast({
      title: 'Saving...',
      description: "Please wait a moment!",
      status: 'info',
      duration: 5000,
      isClosable: true,
    })

    fetch(apiEndpoint + "/save", { method: "POST", body: JSON.stringify(formData), headers: { "Authorization": data.data.access_token }})
    .then(response => response.json())
    .then(data => {
      setProcessing(false)
      if (!data.success) {
        console.error(data.message);
        toast({
          title: 'Saving Failed.',
          description: "Error: " + data.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Saved Settings.',
          description: "You're settings have been carefully recorded!",
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
    })
    .catch(error => {
      setProcessing(false)
      console.error(error);
      toast({
        title: 'Saving Failed.',
        description: "Unkown Error. (Check Console)",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }

  const sync = () => {
    // console.log(formData)
    setProcessing(true)
    toast({
      title: 'Syncing...',
      description: "Please wait a moment!",
      status: 'info',
      duration: 5000,
      isClosable: true,
    })

    fetch(apiEndpoint + "/sync", { method: "POST", body: JSON.stringify(formData), headers: { "Authorization": data.data.access_token }})
    .then(response => response.json())
    .then(data => {
      setProcessing(false)
      if (!data.success) {
        console.error(data.message);
        toast({
          title: 'Syncing Failed.',
          description: "Error: " + data.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Timetable Synced.',
          description: "You're good to go!",
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
    })
    .catch(error => {
      setProcessing(false)
      console.error(error);
      toast({
        title: 'Syncing Failed.',
        description: "Unkown Error. (Check Console)",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }

  const handleNameChange = (e) => {
    setFormData({...formData, name: e.target.value})
  }
  const handleAlertChange = (e) => {
    setFormData({...formData, email_notif: e.target.checked})
  }
  const handleCourseChange = (e) => {
    setFormData({...formData, course_code: e.target.value})
  }
  const handleFreqChange = (e) => {
    setFormData({...formData, sync_time: e.target.value})
  }
  const handleIgnoredChange = (e) => {
    if (!deleteMode) {
      if (!localIgnores) {
        setLocalIgnores([ignoreInput.current.value])
        let sysIgnores = formData.ignore_events == null ? [] : formData.ignore_events;
        sysIgnores.push(ignoreInput.current.value)
        setFormData({...formData, ignore_events: sysIgnores})
      } else {
        setLocalIgnores([...localIgnores, ignoreInput.current.value])
        let sysIgnores = formData.ignore_events == null ? [] : formData.ignore_events;
        sysIgnores.push(ignoreInput.current.value)
        setFormData({...formData, ignore_events: sysIgnores})
      }
      ignoreInput.current.value = null
    } else {
      const updatedIgnores = localIgnores.filter(item => item !== ignoreInput.current.value)
      setLocalIgnores(updatedIgnores)
      setFormData({...formData, ignore_events: updatedIgnores})
      ignoreInput.current.value = null
      setDeleteMode(false)
    }
  }


  const checkIfDelete = (e) => {
    const val = e.target.value
    if (!localIgnores) return;
    if (localIgnores.includes(val)) {
      setDeleteMode(true)
    } else [
      setDeleteMode(false)
    ]
  }

  const {colorMode} = useColorMode();

  return (
    <Box bgColor={colorMode == "light" ? "gray.200" : "gray.700"} borderRadius="2em" width="30em" height="em" p={3} pb={5} maxHeight="95vh">
        <Center>
          <Avatar mt={4} size="lg" name={formData.name} src={formData.user_picture} />
        </Center>
        <Heading mt={2} textAlign="center">Hey {data.data.name}!</Heading>
        <Text mt={1} fontSize="small" textAlign="center">Not you? <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => logout()}>Logout</span></Text>

        <Text>Select your course...</Text>
        <Select mt={2} placeholder='Select Course' bgColor={colorMode == "light" ? "gray.100" : "gray.800"} value={formData.course_code === "" ? "Select Course" : formData.course_code} onChange={handleCourseChange}>
            {availableCourses.map((course) => (
                <option key={course} value={course}>{course}</option>
            ))}
        </Select>
        <Text mt={1} fontSize="x-small">Course not listed? Email: <Link href="mailto:james@jamesz.dev">james@jamesz.dev</Link></Text>

        <Text mt={2}>Update Frequency:</Text>
        <Select mt={2} placeholder='Select Frequency' bgColor={colorMode == "light" ? "gray.100" : "gray.800"} value={formData.sync_time === "" ? "Select Frequency" : formData.sync_time} onChange={handleFreqChange}>
          <option value="daily">Daily (8:30 am)</option>
          <option value="once">Only this one time</option>

        </Select>

        <FormControl display='flex' alignItems='center' mt={2}>
        <FormLabel htmlFor='email-alerts' mb='0'>
          Enable email alerts?
        </FormLabel>
        <Switch id='email-alerts' mr={2} isChecked={formData.email_notif} onChange={handleAlertChange}/>
        <Tooltip label='If this is enabled, Timetable Sync will email you each morning with a summary of your timetable for the day.' fontSize='md'>
          <QuestionIcon />
        </Tooltip>
        </FormControl>

        <Text mt={2}>Preferred Name</Text>
        <FormControl display='flex' alignItems='center' mt={1} mb={4}>
        <Input id="preferredName" defaultValue={data.data.name} bgColor={colorMode == "light" ? "gray.100" : "gray.800"} mr={1} onChange={handleNameChange} />
        <Tooltip label="If you'd like to use a different name to what is on your DCU email then you can put it here :)" fontSize='md'>
          <QuestionIcon />
        </Tooltip>
        </FormControl>

        <Text mt={2}>Ignored Events</Text>
        <Text fontSize="xs">Currently ignoring: {!localIgnores || localIgnores.length === 0 ? "None" : localIgnores.join(", ")}</Text>
        <FormControl display='flex' alignItems='center' mt={1} mb={4}>
        <InputGroup>
            <InputRightElement width='4.5rem'>
              <Button h='1.75rem' size='sm' onClick={handleIgnoredChange}>
                {deleteMode ? "Remove" : "Add"}
              </Button>
            </InputRightElement>

          <Input id="ignoredEvents" bgColor={colorMode == "light" ? "gray.100" : "gray.800"} mr={1} ref={ignoreInput} onChange={checkIfDelete} placeholder="MS134[1]OC/T1/04 GrpA"/>
        </InputGroup>

        <Tooltip label="If you would like to exclude certain events from your timetable (e.g Tutorial Groups that are not yours), then add the name here." fontSize='md'>
          <QuestionIcon />
        </Tooltip>
        </FormControl>

        <Text mt={2} mb={2} color="gray.500">Last Synced: {data.data.last_sync.startsWith("0") ? "Never" : data.data.last_sync}</Text>

        {/* maybe include loading here?? */}
        <Button colorScheme='green' w="100%" onClick={save} isDisabled={processing}>Save</Button>
        <HStack>
          <Button colorScheme='blue' w="100%" mt={4} onClick={sync} isDisabled={processing}>Sync Now</Button>
          <DeleteAccount processing={processing} setProcessing={setProcessing} setSignIn={setSignIn} formData={formData} apiEndpoint={apiEndpoint} />
        </HStack>
        <Button colorScheme='purple' w="100%" mt={4} hidden={!data.data.admin} onClick={onOpen}>Admin Menu</Button>
        <Admin isOpen={isOpen} onClose={onClose} apiEndpoint={apiEndpoint} userEmail={data.data.email} userId={data.data.google_id} userToken={data.data.access_token} />
    </Box>
  )
}
