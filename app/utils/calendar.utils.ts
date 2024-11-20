import moment, { Moment } from 'moment';

const closingTime = 19; // 7:00 PM
const openingTime = 9; // 9:00 AM

export const isoDateConverter = (date: Date | string) => {
  const convertToAdjustedDate = (dateObj: Date) => {
    const offset = dateObj.getTimezoneOffset() * 60000; 
    return new Date(dateObj.getTime() - offset + (8 * 60 * 60000)); 
  };

  if (typeof date === 'string') {
    const newDate = new Date(date);
    return convertToAdjustedDate(newDate);
  } else {
    return convertToAdjustedDate(date);
  }
};

export const getDay = (date: Date) => {

  const day = date.getDay();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

export const generateTimeSlots = (start: Moment, end: Moment) => {
  const result = [];
  const current = start

  while (current.isBefore(end)) {
 
    const time = current.format('HH:mm');

    result.push({ time: `${time}` });

    // Increment by 15 minutes in UTC
    current.add(15, 'minutes');
  }

  return result;
};

export const convertTimeToIsoDate = (time: string) => {
  const date = new Date();
  
  // Reset date to midnight (00:00:00.000)
  date.setHours(0, 0, 0, 0);
  
  const [hours, minutes] = time.split(':').map(Number); // Convert to numbers directly
  
  // Validate time format (HH:mm)
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
    throw new Error('Invalid time format');
  }

  // Set the time to the given military time
  date.setHours(hours, minutes, 0, 0); // Sets hours, minutes, and zeroes out seconds and milliseconds

  return date;
};
