import { Box, Text, Heading, Select, FormLabel, Switch, FormControl, Tooltip, Button, Link, Input, Avatar, Center, useToast } from '@chakra-ui/react'
import React, { useState, useEffect } from 'react'
import { QuestionIcon } from "@chakra-ui/icons"
import { googleLogout } from '@react-oauth/google'

export default function LoggingIn({ setSignIn, data }) {
  const toast = useToast()
  const [processing, setProcessing] = useState(false)
  const availableCourses = [
    "COMSCI1",
  ]

  const apiEndpoint = "http://localhost:1323";

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

  return (
    <Box bgColor="gray.200" borderRadius="2em" width="30em" height="45em" p={3}>
        <Center>
          <Avatar mt={4} size="lg" name={formData.name} src={formData.user_picture} />
        </Center>
        <Heading mt={2} textAlign="center">Hey {data.data.name}!</Heading>
        <Text mt={1} fontSize="small" textAlign="center">Not you? <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => logout()}>Logout</span></Text>

        <Text mt={4}>Select your course...</Text>
        <Select mt={2} placeholder='Select Course' bgColor="gray.100" value={formData.course_code === "" ? "Select Course" : formData.course_code} onChange={handleCourseChange}>
            {availableCourses.map((course) => (
                <option key={course} value={course}>{course}</option>
            ))}
        </Select>
        <Text mt={1} fontSize="x-small">Course not listed? Email: <Link href="mailto:james@jamesz.dev">james@jamesz.dev</Link></Text>

        <Text mt={4}>Update Frequency:</Text>
        <Select mt={2} placeholder='Select Frequency' bgColor="gray.100" value={formData.sync_time === "" ? "Select Frequency" : formData.sync_time} onChange={handleFreqChange}>
          <option value="daily">Daily (8:30 am)</option>
          <option value="once">Only this one time</option>

        </Select>

        <FormControl display='flex' alignItems='center' mt={4}>
        <FormLabel htmlFor='email-alerts' mb='0'>
          Enable email alerts?
        </FormLabel>
        <Switch id='email-alerts' mr={2} isChecked={formData.email_notif} onChange={handleAlertChange}/>
        <Tooltip label='If this is enabled, Timetable Sync will email you each morning with a summary of your timetable for the day.' fontSize='md'>
          <QuestionIcon />
        </Tooltip>
        </FormControl>

        <Text mt={4}>Preferred Name</Text>
        <FormControl display='flex' alignItems='center' mt={1} mb={4}>
        <Input id="preferredName" placeholder={data.data.name} bgColor="gray.100" mr={1} onChange={handleNameChange} />
        <Tooltip label="If you'd like to use a different name to what is on your DCU email then you can put it here :)" fontSize='md'>
          <QuestionIcon />
        </Tooltip>
        </FormControl>

        <Text mt={4} mb={4} color="gray.500">Last Synced: {data.data.last_sync.startsWith("0") ? "Never" : data.data.last_sync}</Text>

        {/* maybe include loading here?? */}
        <Button colorScheme='green' w="100%" onClick={save} isDisabled={processing}>Save</Button>
        <Button colorScheme='blue' w="100%" mt={4} onClick={sync} isDisabled={processing}>Sync Now</Button>
        <Button colorScheme='red' w="100%" mt={4} isDisabled={processing}>Stop Syncing</Button>
    </Box>
  )
}
