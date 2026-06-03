import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Target, Eye, Users, Droplet,
  Shield, Clock, Award, Moon, Sun,
} from 'lucide-react';
import { ABOUT_US } from '../../config/imageAssets';
import './AboutUs.css';

/* ─── Static Data ─────────────────────────────────────────────────────────── */

const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Dr. Sarah Mitchell',
    role: 'Chief Medical Officer',
    image:
      'https://images.unsplash.com/photo-1652549210870-bf3a6955f9d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcyNjU1NTYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2,
    name: 'Dr. James Anderson',
    role: 'Director of Operations',
    image:
      'https://images.unsplash.com/photo-1755189118414-14c8dacdb082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzI3MjQxMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3,
    name: 'Michael Chen',
    role: 'Blood Bank Manager',
    image:
      'https://images.unsplash.com/photo-1758691463605-f4a3a92d6d37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGVhbHRoY2FyZSUyMHdvcmtlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3Mjc0MjAyM3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 4,
    name: 'Emily Rodriguez',
    role: 'Head Nurse & Coordinator',
    image:
      'https://images.unsplash.com/photo-1676552055618-22ec8cde399a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXJzZSUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3Mjc0MjAyM3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const CORE_VALUES = [
  {
    id: 'compassion',
    Icon: Droplet,
    title: 'Compassion',
    description:
      'Every drop counts. We treat each donation and patient with utmost care and respect.',
  },
  {
    id: 'safety',
    Icon: Shield,
    title: 'Safety First',
    description:
      'Rigorous testing and quality control ensure the highest safety standards for all blood products.',
  },
  {
    id: 'availability',
    Icon: Clock,
    title: '24/7 Availability',
    description:
      "Round-the-clock operations to ensure blood is available whenever and wherever it's needed.",
  },
  {
    id: 'excellence',
    Icon: Award,
    title: 'Excellence',
    description:
      'Committed to maintaining the highest standards in blood banking and healthcare services.',
  },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

export function AboutUs() {
  const t = 'light'; // Forced light mode since dark mode is removed

  // Scroll animations logic exactly like ContactPage
  useEffect(() => {
    const observerOptions = { 
      threshold: 0.1, 
      rootMargin: '0px 0px -50px 0px' 
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // This selects all elements with the animation class
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`au-page ${t}`}>



      {/* ══════════════ HERO ══════════════ */}
      <section className="au-hero animate-on-scroll" style={{
    backgroundImage: `linear-gradient(135deg, rgba(18, 25, 33, 0.93), rgba(183, 28, 28, 0.82)), url(${ABOUT_US.auHero})`
        }}>
        <div className="au-hero__inner">
          {/* "Behind the Drop" badge */}
          <div className="au-hero__badge">
            <Droplet size={20} />
            <span>Behind the Drop</span>
          </div>

          <h1 className="au-hero__title">
            Saving Lives Through Every Drop of Blood
          </h1>

          <p className="au-hero__subtitle">
            For over two decades, we've been at the forefront of blood bank
            management, connecting generous donors with patients in need and
            ensuring safe, timely access to life-saving blood products.
          </p>
        </div>
      </section>

      {/* ══════════════ VISION & MISSION ══════════════ */}
      <div className="au-vm-section animate-on-scroll">
        <div className="au-vm-grid">

          {/* Vision Card */}
          <div className={`au-vm-card ${t}`}>
            <div className="au-vm-card__icon-wrap">
              <Eye size={32} color="#fff" />
            </div>
            <h2 className={`au-vm-card__title ${t}`}>Our Vision</h2>
            <p className={`au-vm-card__text ${t}`}>
              To create a world where no life is lost due to blood shortage. We
              envision a comprehensive, efficient, and accessible blood banking
              system that serves every community with dignity, reliability, and
              compassion, ensuring that safe blood is available to all who need
              it, when they need it.
            </p>
          </div>

          {/* Mission Card */}
          <div className={`au-vm-card ${t}`}>
            <div className="au-vm-card__icon-wrap">
              <Target size={32} color="#fff" />
            </div>
            <h2 className={`au-vm-card__title ${t}`}>Our Mission</h2>
            <p className={`au-vm-card__text ${t}`}>
              To provide safe, high-quality blood and blood products through
              innovative management systems, dedicated healthcare professionals,
              and strong community partnerships. We are committed to maintaining
              the highest standards of safety, efficiency, and service excellence
              in all our operations.
            </p>
          </div>

        </div>
      </div>

      {/* ══════════════ CORE VALUES ══════════════ */}
      <section className={`au-values animate-on-scroll${t}`}>
        <div className="au-values__inner">
          <div className="au-section-header">
            <h2 className={`au-section-title ${t}`}>Our Core Values</h2>
            <p className={`au-section-sub ${t}`}>
              The principles that guide everything we do
            </p>
          </div>

          <div className="au-values__grid">
            {CORE_VALUES.map((value) => (
              <div key={value.id} className={`au-value-card ${t}`}>
                <div className={`au-value-card__icon ${t}`}>
                  {React.createElement(value.Icon, { size: 32 })}
                </div>
                <h3 className={`au-value-card__title ${t}`}>{value.title}</h3>
                <p className={`au-value-card__desc ${t}`}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ MEET OUR TEAM ══════════════ */}
      <div className="au-team-section animate-on-scroll">
        <div className="au-section-header">
          <div className={`au-team-section__icon ${t}`}>
            <Users size={32} />
          </div>
          <h2 className={`au-section-title ${t}`}>Meet Our Team</h2>
          <p className={`au-section-sub ${t}`}>
            Dedicated professionals committed to excellence in blood banking and
            patient care
          </p>
        </div>

        <div className="au-team__grid">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.id} className={`au-team-card ${t}`}>
              <div className="au-team-card__img-wrap">
                <img src={member.image} alt={member.name} />
                <div className="au-team-card__overlay" />
              </div>
              <div className="au-team-card__info">
                <h3 className={`au-team-card__name ${t}`}>{member.name}</h3>
                <p className="au-team-card__role">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ WORKING TOGETHER ══════════════ */}
      <section className={`au-working ${t}`}>
        <div className="au-working__inner">
          <div className={`au-working__card ${t}`}>

            {/* Text side */}
            <div className="au-working__text">
              <h2 className={`au-working__title ${t}`}>Working Together</h2>
              <p className={`au-working__para ${t}`}>
                Our{' '}
                <span className="au-working__highlight">
                  multidisciplinary team
                </span>{' '}
                collaborates seamlessly to ensure that every aspect of blood
                bank management meets the highest standards of excellence.
              </p>
              <p className={`au-working__para ${t}`}>
                From collection to distribution, we work hand-in-hand to save
                lives every single day.
              </p>
              <div className="au-working__tags">
                {['Excellence', 'Innovation', 'Teamwork'].map((tag) => (
                  <span key={tag} className="au-working__tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Image side */}
            <div className="au-working__img-wrap">
              <img
                src={ABOUT_US.workingTogether}
                alt="Healthcare professionals working together"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER / CTA ══════════════ */}
      <footer className="au-footer">
        <div className="au-footer__inner">
          <h2 className="au-footer__title">Join Us in Saving Lives</h2>
          <p className="au-footer__subtitle">
            Whether you're a donor, healthcare provider, or organization, there
            are many ways to support our mission and make a difference in your
            community.
          </p>
          <div className="au-footer__buttons">
            <Link to="/donor-dashboard" className="au-cta-btn">
              Become a Donor
            </Link>
            <Link to="/contact" className="au-cta-btn">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
export default AboutUs;