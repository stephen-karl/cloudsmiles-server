import { toZonedTime } from "date-fns-tz";
import {startOfWeek, endOfWeek } from 'date-fns';
import { TZDate } from "@date-fns/tz";

const timeZone = 'Asia/Taipei';


export const mergeTimeAndDate = (date: string, time: string): Date => {
  const newDate = date.split('T')[0]; // Extract the date part (assuming 'date' is in ISO format)
  const finalDate = `${newDate}T${time}:00`; // Combine date and time into an ISO string
  const mergedDate = new TZDate(finalDate, timeZone); // Convert the ISO string to a Date object
  return mergedDate;
};


export const getStartAndEndOfDay = (dateString: string) => {

  const newDate = dateString.split('T')[0]; // Extract the date part (assuming 'date' is in ISO format)

  const startOfDay = `${newDate}T00:00:00.000Z`;
  const endOfDay = `${newDate}T23:59:59.999Z`;

  return { startOfDay: startOfDay, endOfDay: endOfDay };
};

export const getWeekRange = (date: string): { start: Date, end: Date } => {
  // Convert the input date string to a Date object
  const inputDate = new TZDate(date, timeZone);
  // Get the start of the week (Monday)
  const startOfTheWeek = startOfWeek(inputDate, { weekStartsOn: 1 }); // Week starts on Monday
  const endOfTheWeek = endOfWeek(inputDate, { weekStartsOn: 1 }); // Week ends on Sunday

  return {
    start: startOfTheWeek,
    end: endOfTheWeek,
  };
};

export const getMonthRange = (date: string): { start: Date, end: Date } => {
  // Convert the input date string to a Date object
  const inputDate = new TZDate(date, timeZone);
  // Get the start of the month
  const startOfMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
  // Get the end of the month
  const endOfMonth = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);

  return {
    start: startOfMonth,
    end: endOfMonth,
  };
}

export const addDateOffset = (date: Date): string => {
  // Extract date and time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  // Format to "YYYY-MM-DDTHH:mm:ss.SSS"
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

export const removeDateOffset = (stringDate: string): Date => {
  const date = new Date(stringDate);
  date.setHours(date.getHours() - 8);
  return date;
}

export const combineDateAndTime = (dateString: string, timeString: string): string => {
  const date = dateString.split('T')[0];
  return `${date}T${timeString}:00.000Z`;
};

export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  // Split the time string into hours and minutes
  const [hours, minutes] = time.split(':').map(Number);

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  // Add the specified number of minutes
  date.setMinutes(date.getMinutes() + minutesToAdd);

  const newHours = date.getHours().toString().padStart(2, '0');
  const newMinutes = date.getMinutes().toString().padStart(2, '0');

  return `${newHours}:${newMinutes}`;
};

const getSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export const formatDateWithSuffix = (date: string): string => {
  const formattedDate = new Date(date);
  const day = formattedDate.getDate();
  const month = formattedDate.toLocaleString('default', { month: 'long' });
  const year = formattedDate.getFullYear();

  return `${day}${getSuffix(day)} ${month} ${year}`;
}
