/**
 * Formats a date into YYYY-MM-DD format.
 * @param date The date to format, can be a Date object, string, or undefined.
 * @returns The formatted date string or an empty string if the date is invalid.
 */
export const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) {
    return '';
  }

  try {
    // Add timezone offset to prevent the date from being off by one day
    const dateObj = new Date(date);
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Failed to format date:", date, error);
    return '';
  }
};