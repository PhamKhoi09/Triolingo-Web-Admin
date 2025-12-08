// Avatar mapping for usernames - matches with jpg files in assets/img/avatars
// Format: username -> avatar filename (without path)
const AVATAR_MAP = {
  'admin121': require('assets/img/avatars/admin121.jpg'),
  'ann': require('assets/img/avatars/ann.jpg'),
  'day1711': require('assets/img/avatars/day1711.jpg'),
  'day2111': require('assets/img/avatars/day2111.jpg'),
  'day512': require('assets/img/avatars/day512.jpg'),
  'hihi': require('assets/img/avatars/hihi.jpg'),
  'khoi': require('assets/img/avatars/khoi.jpg'),
  'kien': require('assets/img/avatars/kien.jpg'),
  'loiuser': require('assets/img/avatars/loiuser.jpg'),
};

// Default fallback avatars (png files)
const DEFAULT_AVATARS = [
  require('assets/img/avatars/avatar1.png'),
  require('assets/img/avatars/avatar2.png'),
  require('assets/img/avatars/avatar3.png'),
  require('assets/img/avatars/avatar4.png'),
  require('assets/img/avatars/avatar5.png'),
  require('assets/img/avatars/avatar6.png'),
  require('assets/img/avatars/avatar7.png'),
  require('assets/img/avatars/avatar8.png'),
  require('assets/img/avatars/avatar9.png'),
  require('assets/img/avatars/avatar10.png'),
];

/**
 * Get avatar for a username
 * First tries to match username exactly
 * If no match, returns a random default avatar
 * @param {string} username - The username to get avatar for
 * @returns {string} - Path to avatar image
 */
export function getAvatarForUsername(username) {
  // Try exact username match first
  if (username && AVATAR_MAP[username.toLowerCase()]) {
    return AVATAR_MAP[username.toLowerCase()];
  }
  
  // Fallback: return a random default avatar
  const randomIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
  return DEFAULT_AVATARS[randomIndex];
}

/**
 * Get a consistent fallback avatar based on username hash
 * Ensures same username always gets same fallback avatar
 * @param {string} username - The username to get avatar for
 * @returns {string} - Path to avatar image
 */
export function getAvatarForUsernameConsistent(username) {
  // Try exact username match first
  if (username && AVATAR_MAP[username.toLowerCase()]) {
    return AVATAR_MAP[username.toLowerCase()];
  }
  
  // Fallback: use hash of username to get consistent avatar
  if (username) {
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % DEFAULT_AVATARS.length;
    return DEFAULT_AVATARS[index];
  }
  
  return DEFAULT_AVATARS[0];
}
