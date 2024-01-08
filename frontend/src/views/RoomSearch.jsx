import { Box, Text, Heading, Tabs, Tab, TabList, TabPanels, TabPanel, Select, FormLabel, Switch, FormControl, Tooltip, Button, Link, Input, Avatar, Center, useToast, InputGroup, InputRightElement, HStack } from '@chakra-ui/react'
import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeftIcon, SearchIcon } from "@chakra-ui/icons"
import DeleteAccount from '../components/DeleteAccount'

export default function RoomSearch() {
  const apiEndpoint = "https://api-ts.jamesz.dev";
  // const apiEndpoint = "http://localhost:1323";
  const toast = useToast()

  const [buildings, setBuildings] = useState(["McNulty", "Business Building", "The U"])

  const backHome = () => {
    window.location.href = "/"
  }

  const search = () => {
    console.warn("Searching...")
  }

  return (
    <Box bgColor="gray.200" borderRadius="2em" width="30em" height="em" p={3} pb={5} maxHeight="95vh">
      <Heading textAlign="center" fontSize="3xl">DCU Room Availability Checker</Heading>

      <Tabs>
        <TabList>
          <Tab>Search a Building</Tab>
          <Tab>Check Specific Room</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Select variant="filled" placeholder='Select Building' cursor="pointer">
              {buildings.map(building => (
                <option value={building} key={building}>{building}</option>
              ))}
            </Select>
            <Button colorScheme='green' w="100%" mt={4} onClick={search}><SearchIcon mr={2} /> Search</Button>
          </TabPanel>
          <TabPanel>
            <p>two!</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
        {/* <Center>
          <Avatar mt={4} size="lg" name={formData.name} src={formData.user_picture} />
        </Center>
        <Text mt={1} fontSize="small" textAlign="center">Not you? <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => logout()}>Logout</span></Text>

        <Text>Select your course...</Text>
        <Select mt={2} placeholder='Select Course' bgColor="gray.100" value={formData.course_code === "" ? "Select Course" : formData.course_code} onChange={handleCourseChange}>
            {availableCourses.map((course) => (
                <option key={course} value={course}>{course}</option>
            ))}
        </Select>
        <Text mt={1} fontSize="x-small">Course not listed? Email: <Link href="mailto:james@jamesz.dev">james@jamesz.dev</Link></Text>

        <Text mt={2}>Update Frequency:</Text>
        <Select mt={2} placeholder='Select Frequency' bgColor="gray.100" value={formData.sync_time === "" ? "Select Frequency" : formData.sync_time} onChange={handleFreqChange}>
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
        <Input id="preferredName" defaultValue={data.data.name} bgColor="gray.100" mr={1} onChange={handleNameChange} />
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

          <Input id="ignoredEvents" bgColor="gray.100" mr={1} ref={ignoreInput} onChange={checkIfDelete} placeholder="MS134[1]OC/T1/04 GrpA"/>
        </InputGroup>

        <Tooltip label="If you would like to exclude certain events from your timetable (e.g Tutorial Groups that are not yours), then add the name here." fontSize='md'>
          <QuestionIcon />
        </Tooltip>
        </FormControl>

        <Text mt={2} mb={2} color="gray.500">Last Synced: {data.data.last_sync.startsWith("0") ? "Never" : data.data.last_sync}</Text>

        <Button colorScheme='green' w="100%" onClick={save} isDisabled={processing}>Save</Button>
        <HStack>
          <Button colorScheme='blue' w="100%" mt={4} onClick={sync} isDisabled={processing}>Sync Now</Button>
          <DeleteAccount processing={processing} setProcessing={setProcessing} setSignIn={setSignIn} formData={formData} apiEndpoint={apiEndpoint} />
        </HStack> */}
      <Button colorScheme='teal' w="100%" mt={4} onClick={backHome}><ArrowLeftIcon mr={4} /> Back Home</Button>
    </Box>
  )
}
