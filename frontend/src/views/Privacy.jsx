import { Box, Text, Heading, Divider, UnorderedList, ListItem, Center } from '@chakra-ui/react'
import React from 'react'

export default function Privacy() {

  return (
    <Center h="auto" pb={2}>
    <Box ml={5} mr={5} width="600px" height="fit-content">
        <Heading mt={5} textAlign="center">Privacy Policy for Timetable Sync</Heading>
        <Divider mt={3} mb={5} borderWidth={1} />

        <Heading fontSize="2xl" as="h3">1. Introduction</Heading>
        <Text>Welcome to Timetable Sync ("App"). This Privacy Policy outlines what data we safely collect, use and dispose of when you use the App.</Text>
        <Heading fontSize="2xl" as="h3" mt={2}>2. Information We Collect</Heading>
        <Text>We only collect data absolutely necessary for the App to function. This includes:</Text>
        <UnorderedList>
            <ListItem><b>Basic information about your Google Account.</b> This includes your email, name, account ID & you're profile picture.</ListItem>
            <ListItem><b>Google Calendar Access Tokens.</b> We store an access + refresh token to allow the App to access your Google Calendar. This is so the App can keep your timetable up to date. This access is strictly limited to Google Calendar, and can be revoked at any time via your Google Account.</ListItem>
            <ListItem><b>User Settings.</b> We store your settings you set on the App. This includes your Course Code, your sync time preference, email notifications and events you have set to be ignored.</ListItem>
        </UnorderedList>
        <Heading fontSize="2xl" as="h3" mt={2}>3. How We Use Your Information</Heading>
        <Text>The App uses your data to provide it's service, syncing your DCU timetable to Google Calendar. It also uses your email to communicate with you, for example with update notifications or error notifications.</Text>
        <Heading fontSize="2xl" as="h3" mt={2}>4. Sharing Your Information</Heading>
        <Text>We do not share your data with any Third-Party Service apart from to Google for updating your calendar. Your email is also sent through our email provider Sendgrid.net</Text>
        <Text>We may disclose your information in response to a legal request or when required by law to protect our rights, privacy, safety or property.</Text>
        <Heading fontSize="2xl" as="h3" mt={2}>5. Data Security</Heading>
        <Text>We have implemented data storage with security measures in mind to protect your information from unauthorized action.</Text>
        <Heading fontSize="2xl" as="h3" mt={2}>6. Deletion Of Your Data</Heading>
        <Text>When you delete your account from the settings page, your data is deleted from our systems immediately. You can also contact us (shown below) to query what data we store, or to request this data be deleted.</Text>
        <Heading fontSize="2xl" as="h3" mt={2}>7. Changes to This Privacy Policy</Heading>
        <Text>We may update this Privacy Policy from time to time. Any changes will be effective upon this page being updated.</Text>
        <Heading fontSize="2xl" as="h3" mt={2}>8. Contact Us</Heading>
        <Text>If you have any questions or concerns about this Privacy Policy, you can email us at: <a href="mailto:me@jamesz.dev" style={{ textDecoration: "underline" }}>me@jamesz.dev</a></Text>
        
        <Heading mt={5} textAlign="center" id="disclosure">Disclosure</Heading>
        <Divider mt={3} mb={5} borderWidth={1} />
        <Text>Timetable Sync's use and transfer to any other app of information received from the Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target='_blank' style={{ textDecoration: "underline" }}>Google API Services User Data Policy</a>, including the Limited Use requirements.</Text>


       <Text mt={10}>Thank you for using Timetable Sync! By using the App, you agree to the terms set out in this Privacy Policy.</Text>

       <Divider mt={3} mb={5} borderWidth={1} />

       <Text>Last Updated: 31st Jan 2024</Text>
       <Text><a href="/" style={{ textDecoration: "underline" }}>Back Home</a></Text>

    </Box>

    </Center>
  )
}
