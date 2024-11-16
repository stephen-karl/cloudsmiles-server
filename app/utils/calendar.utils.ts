
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


