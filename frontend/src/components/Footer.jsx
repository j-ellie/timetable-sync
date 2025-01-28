import { Text, Box } from "@chakra-ui/react"

export default function Footer() {
    return (
      <Box mt={5}>
        <footer>
          {/* <Text textAlign="center" fontSize="sm">Timetable Sync is not affiliated with DCU. Made by <a href="https://jamesz.dev" target='_blank' style={{ textDecoration: "underline", fontWeight: "bold"}}>James</a> </Text> */}
          <Text textAlign="center" fontSize="sm">Timetable Sync is not affiliated with DCU. Made by <a href="https://elliee.me?utm_source=ts" style={{ textDecoration: "underline", fontWeight: "bold"}} target="_blank">Ellie</a> (V: {__APP_VERSION__})</Text>
          <Text textAlign="center" fontSize="sm">By using this app, you agree to our: <a href="/privacy" style={{ textDecoration: "underline", fontWeight: "bold"}}>Privacy Policy</a></Text>
        </footer>
      </Box>
    )
}
