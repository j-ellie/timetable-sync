import { Text, Box } from "@chakra-ui/react"

export default function Footer() {
    return (
      <Box position="fixed" bottom="1">
        <footer>
          <Text textAlign="center" fontSize="sm">Timetable Sync is not affiliated with DCU. Made by <a href="https://jamesz.dev" target='_blank' style={{ textDecoration: "underline", fontWeight: "bold"}}>James</a> </Text>
          <Text textAlign="center" fontSize="sm">By using this app, you agree to our: <a href="/privacy" style={{ textDecoration: "underline", fontWeight: "bold"}}>Privacy Policy</a></Text>
        </footer>
      </Box>
    )
}
