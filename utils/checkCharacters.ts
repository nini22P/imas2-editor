import characters from './characters';

const checkCharacters = (inputString: string): string[] => {
  const validChars = new Set(characters);
  const invalidChars: string[] = [];
  for (const char of inputString) {
    const charCodeHex = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');

    if (validChars.has(char) || ['\n', ' '].includes(char)) {
      continue;
    }

    if (charCodeHex.match(/^E[0-9A-Fa-f]{3}$/)) {
      continue;
    }

    if (!invalidChars.includes(char)) {
      invalidChars.push(char);
    }
  }

  return invalidChars;
};

export default checkCharacters;