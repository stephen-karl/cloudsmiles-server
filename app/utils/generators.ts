export const generateRandomPassword = (length: number, options: { 
  includeUppercase?: boolean, 
  includeLowercase?: boolean, 
  includeNumbers?: boolean, 
  includeSpecialChars?: boolean 
} = {}): string => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';

  let allChars = '';
  if (options.includeUppercase) allChars += uppercaseChars;
  if (options.includeLowercase) allChars += lowercaseChars;
  if (options.includeNumbers) allChars += numberChars;
  if (options.includeSpecialChars) allChars += specialChars;

  if (allChars === '') {
    throw new Error('At least one character set must be selected');
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}

