import ago from "s-ago"

const convertToFriendly = (timeStr) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const dt = new Date(timeStr)
    const day = days[dt.getDay()]
    const month = months[dt.getMonth()]
    const date = dt.getDate()
    const year = dt.getFullYear()

    const hours = dt.getHours()
    let minutes = dt.getMinutes()

    if (minutes === 0) {
        minutes = "00"
    }

    const friendly = ago(dt)

    const returnStr = `${day} ${month} ${date} ${year} @ ${hours}:${minutes} (${friendly})`
    return returnStr
}
export default convertToFriendly;