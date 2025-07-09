const crypto = require('crypto');

// Generate a random 16-digit alphanumeric code
const generateUniqueCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 16; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
};

module.exports = generateUniqueCode;