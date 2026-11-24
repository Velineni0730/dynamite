import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroTitle from '../assets/hero-wordmark.png';
import heroIllustration from '../assets/hero.png';
import heartTop from '../assets/heart_top.png';
import starTop from '../assets/star_top.png';
import cloudTop from '../assets/cloud_top.png';
import brainIcon from '../assets/brain.png';
import bookIcon from '../assets/book.png';
import targetIcon from '../assets/target.png';
import barGraphIcon from '../assets/bar_graph.png';
import bottomPot from '../assets/bottom_pot.png';

const features = [
  { title: 'Protect your mind', description: 'A calmer place to build steady study habits.', icon: brainIcon, tone: 'pink' },
  { title: 'Study smarter', description: 'A personal space for your subjects and sessions.', icon: bookIcon, tone: 'blue' },
  { title: 'Achieve goals', description: 'Turn small, consistent effort into progress.', icon: targetIcon, tone: 'yellow' },
  { title: 'See progress', description: 'Keep track of the work you actually complete.', icon: barGraphIcon, tone: 'lavender' },
];

export default function Home() {
  return (
    <main className="public-home">
      <section className="home-hero">
        <motion.img className="decor decor-heart" src={heartTop} alt="" animate={{ y: [0, -8, 0], rotate: [-5, 3, -5] }} transition={{ repeat: Infinity, duration: 5 }} />
        <motion.img className="decor decor-star" src={starTop} alt="" animate={{ y: [0, -9, 0], rotate: [0, 16, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
        <motion.img className="decor decor-cloud" src={cloudTop} alt="" animate={{ x: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 8 }} />
        <div className="hero-inner">
          <motion.div className="hero-copy" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
            <img className="hero-wordmark" src={heroTitle} alt="Dynamite — Your Study Hero" />
            <p className="hero-kicker">♥ &nbsp; YOUR STUDY HERO &nbsp; ♥</p>
            <p className="hero-description">Stay focused, protect your peace,<br />and become the <strong>best version of you.</strong></p>
            <div className="hero-actions">
              <Link to="/register" className="button-primary">Let's Start <span>➜</span></Link>
              <a href="#how-it-works" className="button-secondary">Explore Dynamite <span>✧</span></a>
            </div>
            <div className="hero-note"><span>✦</span> A little world for your biggest goals.</div>
          </motion.div>
          <motion.div className="hero-art-wrap" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.12 }}>
            <img className="hero-art" src={heroIllustration} alt="Two students enjoying a cozy study session" />
            <div className="speech-bubble">you got this! <b>♥</b></div>
          </motion.div>
        </div>
        <div className="hero-wave" />
      </section>

      <section className="feature-strip" id="how-it-works">
        {features.map((feature) => (
          <article className={`feature-card feature-${feature.tone}`} key={feature.title}>
            <img src={feature.icon} alt="" />
            <div><h3>{feature.title}</h3><p>{feature.description}</p></div>
          </article>
        ))}
      </section>

      <section className="world-section">
        <div className="section-heading">
          <span className="eyebrow">A PLACE THAT FEELS LIKE YOURS</span>
          <h2>Your study life, <span>but actually yours.</span></h2>
          <p>Create your Hero, settle into your own room, and invite someone to study beside you.</p>
        </div>
        <div className="world-grid">
          <article className="world-card world-card-room">
            <div className="world-card-icon">⌂</div><span className="world-tag">YOUR SPACE</span>
            <h3>A little room of your own</h3><p>Your desk, your comfort, your quiet corner. Your avatar waits here until you're ready.</p>
            <div className="room-doodle">✦ 🌱 📚</div>
          </article>
          <article className="world-card world-card-companion">
            <div className="world-card-icon">♡</div><span className="world-tag">YOUR COMPANION</span>
            <h3>Someone who remembers</h3><p>Your future study companion can notice the subjects you revisit and suggest what to practise next.</p>
            <div className="companion-message">"Four DBMS sessions this week. Want a quick BCNF challenge?"</div>
          </article>
          <article className="world-card world-card-friends" id="study-together">
            <div className="world-card-icon">✧</div><span className="world-tag">YOUR PEOPLE</span>
            <h3>Better together</h3><p>Invite a friend, sit in the same cozy room, focus together, and take a break at the same time.</p>
            <div className="buddy-pills"><span>YOU</span><span>+</span><span>YOUR STUDY BUDDY</span></div>
          </article>
        </div>
      </section>

      <section className="home-bottom-cta">
        <img src={bottomPot} alt="A little plant" />
        <span className="eyebrow">SMALL STEPS, EVERY DAY</span>
        <h2>Your room is waiting.</h2>
        <p>Start with one little study session. Let the rest grow from there.</p>
        <Link to="/register" className="button-primary">Create your Hero <span>➜</span></Link>
      </section>
      <footer className="home-footer">
        <div className="footer-brand"><strong>DYNAMITE ✦</strong><small>YOUR STUDY HERO ♥</small></div>
        <p>Focus on progress, not perfection.</p>
        <span>© 2026 Dynamite</span>
      </footer>
    </main>
  );
}
