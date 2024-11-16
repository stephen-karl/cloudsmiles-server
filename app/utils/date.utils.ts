export const mergeTimeAndDate = (date: Date, time: string): Date => {
  const [hour, minute] = time.split(':').map(Number);
  
  // Create a new Date object set to the provided date's local time
  const newDate = new Date(date);
  
  // Set the time on the new Date object
  newDate.setHours(hour, minute, 0, 0); // Set hours and minutes, and reset seconds and milliseconds to 0
  newDate.toString()
  return newDate;
}

export const getStartAndEndOfDay = (dateString: string) => {
  const date = new Date(dateString);
  const startOfDay = new Date(date.setHours(0 + 8, 0, 0, 0)).toISOString();
  const endOfDay = new Date(date.setHours(23 + 8, 59, 59, 999)).toISOString();
  return { startOfDay, endOfDay };
};


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
