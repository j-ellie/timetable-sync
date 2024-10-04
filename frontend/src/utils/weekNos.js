const START_DATE = new Date("09/09/2024")
const getWeekNumber = (date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    return Math.ceil(dayOfYear / 7);
}

const calculateSemWeek = (date) => {
    const startWeek = getWeekNumber(START_DATE);
    const endWeek = getWeekNumber(date);
    return (endWeek - startWeek) + 1;
}

export default calculateSemWeek;