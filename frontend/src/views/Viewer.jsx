import React, { useRef, useState, useEffect, useCallback } from 'react'
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import dayGridPlugin from "@fullcalendar/daygrid"
import { Box,
  Button,
  useToast,
  Spinner, 
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton, 
  useDisclosure,
} from '@chakra-ui/react'  
import { MultiSelect } from 'chakra-multiselect'
import uniqolor from 'uniqolor';
import calculateSemWeek from '../utils/weekNos'
import { toPng } from "html-to-image"
import EventPopover from '../components/EventPopover'
import EmbedModal from '../components/EmbedModal'

export default function Viewer({ apiUrl }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = useRef()
  const calendarRef = useRef();
  const toast = useToast();

  const [initialLoad, setInitialLoad] = useState(false);
  const [embedMode, setEmbedMode] = useState(false);

  const [courseOptions, setCourseOptions] = useState([])
  const [moduleOptions, setModuleOptions] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [selectedModules, setSelectedModules] = useState([])
  const [renderedGroups, setRenderedGroups] = useState([])

  // state and disclosure for event clicking
  const [highlightedEvent, setHighlightedEvent] = useState(null);
  const { isOpen: eventModalOpen, onOpen: eventModalTrigger, onClose: eventModalClose } = useDisclosure();

  const { isOpen: embedModalOpen, onOpen: embedModalTrigger, onClose: embedModalClose } = useDisclosure();

  const cleanEvents = (courseId) => {
    const calApi = calendarRef.current.getApi()
    Object.values(calApi.currentData.eventStore.defs).forEach(event => {
      if (event.publicId.startsWith(courseId)) {
        const eventObj = calApi.getEventById(event.publicId)
        eventObj.remove();
      }
    })
    const updatedRenderedGroups = renderedGroups.filter(g => g != courseId)
    setRenderedGroups(updatedRenderedGroups)
  }

  const fetchCourseEvents = (course, from, to) => {
    course = course.value;
    console.log(">> Fetching events for course: ", course)
    const fullUrl = new URL(apiUrl + `/timetable`)
    fullUrl.searchParams.set("course", course)
    fullUrl.searchParams.set("from", from)
    fullUrl.searchParams.set("to", to)
    fetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        toast({
          title: 'Failed to fetch timetable.',
          description: "Couldn't get timetable from api. Error: " + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      } else {
        if (!data.events) return;
        // calendarRef.current.getApi().removeAllEvents();
        data.events.forEach(event => {
          const bgColor = uniqolor(event.Name.split(" ")[0], { differencePoint: 0})
          calendarRef.current.getApi().addEvent({
            title: event.Name,
            start: event.StartDateTime,
            end: event.EndDateTime,
            id: `${course}-${event.Name}`,
            backgroundColor: bgColor.color,
            
            location: event.Location,
            description: event.Description,
            staff: event.Staff
          })
          // calendarRef.current.getApi().getEventById(`${course}-${event.Name}`).eventContent 
        })
        setRenderedGroups([...renderedGroups, course])
        document.getElementById("loadingSpinner").hidden = true;
      }
    })
    .catch(err => {
      toast({
        title: 'Failed to fetch timetable.',
        description: "Couldn't get timetable from api. Error: " + err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }

  const fetchModuleEvents = (mod, from, to) => {
    mod = mod.value;
    console.log(">> Fetching events for module: ", mod)
    const fullUrl = new URL(apiUrl + `/timetable`)
    fullUrl.searchParams.set("module", mod)
    fullUrl.searchParams.set("from", from)
    fullUrl.searchParams.set("to", to)
    fetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        toast({
          title: 'Failed to fetch timetable.',
          description: "Couldn't get timetable from api. Error: " + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      } else {
        if (!data.events) return;
        // calendarRef.current.getApi().removeAllEvents();
        data.events.forEach(event => {
          const bgColor = uniqolor(event.Name.split(" ")[0])
          calendarRef.current.getApi().addEvent({
            title: event.Name,
            start: event.StartDateTime,
            end: event.EndDateTime,
            id: `${mod}-${event.Name}`,
            backgroundColor: bgColor.color,

            location: event.Location,
            description: event.Description,
            staff: event.Staff
          })
        })
        setRenderedGroups([...renderedGroups, mod])
        document.getElementById("loadingSpinner").hidden = true;
      }
    })
    .catch(err => {
      toast({
        title: 'Failed to fetch timetable.',
        description: "Couldn't get timetable from api. Error: " + err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }

  const repopulateTimetable = async (force=false) => {
    if (!calendarRef.current) return;
    const calApi = calendarRef.current.getApi();
    // console.log(calApi.view)
    const from = calApi.view.currentStart.toUTCString()
    const to = calApi.view.currentEnd.toUTCString()
    
    const courses = selectedCourses?.map(course => course.value)
    const modules = selectedModules?.map(mod => mod.value)

    renderedGroups.forEach(group => {
      if (!courses.includes(group) && !modules.includes(group)) {
        cleanEvents(group)
      }
    })

    selectedCourses?.forEach(course => {
      if (!renderedGroups.includes(course.value) || force) {
        fetchCourseEvents(course, from, to)
      }
    })

    selectedModules?.forEach(mod => {
      if (!renderedGroups.includes(mod.value) || force) {
        fetchModuleEvents(mod, from, to)
      }
    })
  }

  useEffect(() => {
    const courses = selectedCourses?.map(course => course.value)
    const modules = selectedModules?.map(mod => mod.value)
    
    const curr = new URL(window.location.href)

    if (!initialLoad) {
      const urlCourses = curr.searchParams.get("course");
      if (urlCourses) {
        let formattedUrlCourses = [];
        urlCourses.split(",").forEach(c => {
          formattedUrlCourses.push({option: c, value: c})
        })
        setSelectedCourses(formattedUrlCourses);
      }
      const urlModules = curr.searchParams.get("module")
      if (urlModules) {
        let formattedUrlModules = [];
        urlModules.split(",").forEach(m => {
          formattedUrlModules.push({option: m, value: m})
        })
        setSelectedModules(formattedUrlModules);
      }
      const embedMode = curr.searchParams.get("embed")
      if (embedMode) {
        setEmbedMode(true);
      }
      setInitialLoad(true);
      setTimeout(() => {
        document.getElementById("loadingSpinner").hidden = true;
      },1000)
    } else {
      if (selectedCourses.length === 0) {
        curr.searchParams.delete("course")
      } else {
        curr.searchParams.set("course", courses)
      }
  
      if (selectedModules.length === 0) {
        curr.searchParams.delete("module")
      } else {
        curr.searchParams.set("module", modules)
      }
    }


    window.history.replaceState({}, '', curr)

    document.querySelectorAll('[aria-label="toggle menu"]').forEach(el => {
      if (el.getAttribute('aria-expanded') === 'true') {
        el.click()
      }
    })

    // refetch timetable
    document.getElementById("loadingSpinner").hidden = false;
    repopulateTimetable()

  }, [selectedCourses, selectedModules])

  const convertAvailableCourses = (ids) => {
    const options = []
    ids.forEach(course => {
      options.push({label: course, value: course})
    })

    setCourseOptions(options)
    const curr = JSON.parse(localStorage.getItem("cachedOptions")) || {};
    localStorage.setItem("cachedOptions", JSON.stringify({
      ...curr,
      courses: options,       // Update courses with new options
      cacheTime: new Date()    // Update cacheTime with the current date
    }));
  }

  const convertAvailableModules = (ids) => {
    const options = []
    ids.forEach(mod => {
      options.push({label: mod, value: mod})
    })

    setModuleOptions(options)

    const curr = JSON.parse(localStorage.getItem("cachedOptions")) || {};
    localStorage.setItem("cachedOptions", JSON.stringify({
      ...curr,
      modules: options,       // Update courses with new options
      cacheTime: new Date()    // Update cacheTime with the current date
    }));
  }

  useEffect(() => {
    if (courseOptions.length > 0 && moduleOptions.length > 0) return;

    console.log("[option-loader] >> Checking for cached options...")
    const cache = JSON.parse(localStorage.getItem("cachedOptions"));

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); 
    if (cache && new Date(cache.cacheTime) > threeDaysAgo) {
      console.log("[option-loader] >> Using cached options!")

      setModuleOptions(cache.modules)
      setCourseOptions(cache.courses)
      return;
    }

    console.log("[option-loader] >> Cache expired or doesn't exist. Fetching options...")

    fetch(apiUrl + "/options")
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        toast({
          title: 'Failed to fetch timetable options.',
          description: "Couldn't get timetable options from api. Error:" + err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return;
      } else {
        convertAvailableCourses(data.course_ids)
        convertAvailableModules(data.module_ids)
      }
    })
    .catch(err => {
      toast({
        title: 'Failed to fetch timetable options.',
        description: "Couldn't get timetable options from api. Error:" + err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    })
  }, [])

  const renderEventContent = (eventInfo) => {
    let event = eventInfo.event;
    return (
      <div className="custom-event" style={{ margin: ".3em", fontSize: "1em", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden"}}>
        <div className="title"><b>{event.title}</b></div>
        <div className="title" style={{fontSize: "0.8em"}}>{event.start.getHours()}:{event.start.getMinutes().toString().padEnd(2, "0")} - {event.end.getHours()}:{event.end.getMinutes().toString().padEnd(2, "0")}, {event.extendedProps.location}</div>
      </div>
    );
  };

  const handleEventClick = (ev) => {
    setHighlightedEvent(ev.event)
    eventModalTrigger();
  }

  const handleCalDatesSet = (ev) => {
    if (!calendarRef.current) return;
    let cancelRender = false;
    const renderedEvents = calendarRef.current.getApi().getEvents();
    renderedEvents.forEach((event) => {
      if (event.start.getDate() === ev.start.getDate()) {
        cancelRender = true;
        return;
      }
    })
    
    if (!cancelRender) {
      repopulateTimetable(true);
    }
  }

  const downloadFilter = (node) => {
    const exclusionClasses = ['fc-header-toolbar'];
    return !exclusionClasses.some((classname) => node.classList?.contains(classname));
  }

  const downloadImage = useCallback(() => {
    document.getElementById("watermark").hidden = false;
    if (calendarRef.current === null) {
      return
    }

    toPng(document.getElementById("cal-container"), { cacheBust: true, backgroundColor: "white", filter: downloadFilter })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = 'timetable.png'
        link.href = dataUrl
        link.click()
        document.getElementById("watermark").hidden = true;
      })
      .catch((err) => {
        console.log(err)
      })
  }, [calendarRef])

  return (
    <Box width="90vw" height="100vh" mt={5}>
      <Button ref={btnRef} colorScheme='orange' onClick={onOpen} hidden={embedMode} mr={2} mb={1}>
        Edit Selection
      </Button>
      <Button colorScheme='facebook' onClick={embedModalTrigger} hidden={embedMode} mr={2} mb={1}>
        Embed
      </Button>
      <Button colorScheme='green' onClick={downloadImage} hidden={embedMode} mr={2} mb={1}>
        Save to Image
      </Button>
      <Drawer
        isOpen={isOpen}
        placement='top'
        onClose={onClose}
        finalFocusRef={btnRef}
        height="50px"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Change Selection</DrawerHeader>

          <Box ml={6} mr={6}>
          {/* <DrawerBody> */}
          <MultiSelect
            options={courseOptions}
            value={selectedCourses}
            label={selectedCourses.length >= 5 ? 'Remove a course to continue' : 'Choose Courses'}
            onChange={setSelectedCourses}
            disabled={selectedCourses.length >= 5}
            zIndex={10}
            />

          <MultiSelect
            options={moduleOptions}
            value={selectedModules}
            label={selectedModules.length >= 5 ? 'Remove a module to continue' : 'Choose Modules'}
            onChange={setSelectedModules}
            disabled={selectedModules.length >= 5}
            zIndex={10}
            />
          </Box>
          {/* </DrawerBody> */}

          <DrawerFooter>
            <Button variant='outline' mr={3} onClick={onClose}>
              Close
            </Button>
            {/* <Button colorScheme='blue'>Save</Button> */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* <Button onClick={render}>Render</Button> */}
      <Box position="relative" id='cal-container' mt={2} pb={10}>
        <FullCalendar
            plugins={[ timeGridPlugin, dayGridPlugin ]}
            initialView="timeGridWeek"
            weekends={false}
            dayMinWidth="50px"
            height="95vh"
            nowIndicator={true}
            ref={calendarRef}
            slotDuration="00:30:00"
            slotMinTime="08:00:00"
            slotMaxTime="23:00:00"
            allDaySlot={false}
            scrollTime="09:00:00"
            headerToolbar={{
                start: 'title', // will normally be on the left. if RTL, will be on the right
                end: 'today,timeGridDay,timeGridWeek,dayGridMonth,prev,next' // will normally be on the right. if RTL, will be on the left
              }}
            eventContent={renderEventContent}
            weekNumbers={true}
            weekNumberCalculation={calculateSemWeek}
            eventClick={handleEventClick}
            datesSet={handleCalDatesSet}
        />
        <p id="watermark" hidden ml={1}>Generated using Timetable Sync https://ts.elliee.me</p>
      </Box>
      <Box
        position="fixed"
        bottom={10}
        right={10}
        bgColor="white"
        padding=".8em"
        boxShadow="lg"
        rounded="full"
        zIndex={100}
        hidden
        id="loadingSpinner"
      >
        <Spinner />
      </Box>

      <EventPopover event={highlightedEvent} isOpen={eventModalOpen} onClose={eventModalClose} onOpen={eventModalTrigger} calApi={calendarRef} />
      <EmbedModal isOpen={embedModalOpen} onClose={embedModalClose} onOpen={embedModalTrigger} />

    </Box>
  )
}
