import roomBackground from '../../assets/rooms/shared-study-room.png';
import HeroAvatar from '../HeroAvatar';

export default function RoomScene({
  avatarId = 'boy-01',
  showBuddy = false,
  buddyAvatarId = 'girl-01',
  state = 'idle',
  buddyState = 'idle',
  labels = true,
  compact = false,
}) {
  const ownState = ['idle', 'focus', 'break'].includes(state) ? state : 'idle';
  const otherState = ['idle', 'focus', 'break'].includes(buddyState) ? buddyState : 'idle';

  return (
    <div className={`room-scene${compact ? ' room-scene-compact' : ''}`}>
      <img className="room-scene-background" src={roomBackground} alt="A cozy shared study room with two study desks" />
      <div className="room-light-wash" />
      <div className={`room-seat room-seat-left seat-${ownState}`}>
        <HeroAvatar avatarId={avatarId} state={ownState} className="room-character room-character-left" alt="Your Dynamite avatar" />
        {labels && <span className="seat-label seat-label-left">{ownState === 'idle' ? 'YOUR SPACE' : ownState === 'focus' ? 'IN FOCUS' : 'ON A BREAK'}</span>}
      </div>
      {showBuddy ? (
        <div className={`room-seat room-seat-right seat-${otherState}`}>
          <HeroAvatar avatarId={buddyAvatarId} state={otherState} className="room-character room-character-right" alt="Your study buddy's Dynamite avatar" />
          {labels && <span className="seat-label seat-label-right">{otherState === 'idle' ? 'STUDY BUDDY' : otherState === 'focus' ? 'IN FOCUS' : 'ON A BREAK'}</span>}
        </div>
      ) : (
        <div className="empty-seat-note">
          <span className="empty-seat-icon">＋</span>
          <strong>Second seat is open</strong>
          <small>Invite a study buddy</small>
        </div>
      )}
      <div className="room-scene-sparkle sparkle-one">✦</div>
      <div className="room-scene-sparkle sparkle-two">✧</div>
    </div>
  );
}
