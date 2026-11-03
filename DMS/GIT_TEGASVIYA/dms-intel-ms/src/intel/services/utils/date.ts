import * as moment from 'moment';

export function getWeekNumber(date: Date): number {
    const startOfYear = moment(date).startOf('year'); 
    const daysSinceStartOfYear = moment(date).diff(startOfYear, 'days'); 
    return Math.ceil((daysSinceStartOfYear + startOfYear.day()) / 7); 
}
export function calcEpochDay(timestamp: Date) {
    const mdate = moment(timestamp)
    return mdate?.dayOfYear();
}
