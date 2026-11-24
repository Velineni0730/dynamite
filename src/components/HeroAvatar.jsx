import boy01 from '../assets/avatars/boy-01-idle.webp';
import boy02 from '../assets/avatars/boy-02-idle.webp';
import boy03 from '../assets/avatars/boy-03-idle.webp';
import girl01 from '../assets/avatars/girl-01-idle.webp';
import girl02 from '../assets/avatars/girl-02-idle.webp';
import girl03 from '../assets/avatars/girl-03-idle.webp';
import boyFocus from '../assets/avatars/boy-01-focus.webp';
import boyBreak from '../assets/avatars/boy-01-break.webp';
import girlFocus from '../assets/avatars/girl-01-focus.webp';
import girlBreak from '../assets/avatars/girl-01-break.webp';

export const avatarCatalog = [
  { id: 'boy-01', gender: 'boy', name: 'Blue Hoodie', image: boy01 },
  { id: 'boy-02', gender: 'boy', name: 'Campus Green', image: boy02 },
  { id: 'boy-03', gender: 'boy', name: 'Everyday Hero', image: boy03 },
  { id: 'girl-01', gender: 'girl', name: 'Lavender Hoodie', image: girl01 },
  { id: 'girl-02', gender: 'girl', name: 'Soft Academia', image: girl02 },
  { id: 'girl-03', gender: 'girl', name: 'Creative Soul', image: girl03 },
];

const idleSources = Object.fromEntries(avatarCatalog.map((item) => [item.id, item.image]));
const poseSources = {
  'boy-01': { focus: boyFocus, break: boyBreak },
  'girl-01': { focus: girlFocus, break: girlBreak },
};

export function getAvatarSource(avatarId = 'boy-01', state = 'idle') {
  const idle = idleSources[avatarId] || boy01;
  if (state === 'idle') return idle;
  return poseSources[avatarId]?.[state] || idle;
}

export default function HeroAvatar({ avatarId = 'boy-01', state = 'idle', className = '', alt = 'Dynamite Hero' }) {
  const image = getAvatarSource(avatarId, state);
  return <img className={`hero-avatar hero-avatar-${state} ${className}`} src={image} alt={alt} draggable="false" />;
}
