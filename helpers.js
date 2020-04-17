const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};

const generateRandomString = () => {
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(6)]
    .map(() => alphanumeric[Math.floor(Math.random() * 36)])
    .join('');
};

const urlsForUser = userId => {
  return Object.entries(urlDatabase).reduce((acc, [shortURL, urlInfo]) => {
    return urlInfo.userID === userId ? {...acc, [shortURL]: urlInfo} : acc;
  }, {});
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};