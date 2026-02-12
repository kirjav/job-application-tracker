import { useState, useEffect, useCallback } from "react";
import "./Auth.css";
import LoginForm from "../../components/authentication/LoginForm/LoginForm";
import RegisterForm from "../../components/authentication/RegisterForm/RegisterForm";

const SLIDES = [
  {
    title: "Track every application",
    description: "Keep all your job applications in one place—company, role, status, and notes. No more lost spreadsheets.",
  },
  {
    title: "Kanban & table views",
    description: "See your pipeline on a drag-and-drop board or sort and filter in a table. Switch by device—optimized for desktop and mobile.",
  },
  {
    title: "Filter and sort your way",
    description: "Narrow by status, salary, date applied, or tags. Sort by company, date, or salary to find what you need fast.",
  },
  {
    title: "Stay on top of your search",
    description: "Focus on active applications or review older ones. Set your inactivity threshold and keep your list manageable.",
  },
  {
    image: { src: "/art_placeholder.png", alt: "Hawk in pursuit" },
  },
  {
    title: "Your pursuit, organized",
    description: "One simple tool to track applications from first apply to offer—so you can focus on the next step.",
  },
];

const SLIDE_INTERVAL_MS = 6000;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  const goTo = useCallback((index) => {
    setSlideIndex((index + SLIDES.length) % SLIDES.length);
  }, []);

  const goPrev = () => goTo(slideIndex - 1);
  const goNext = () => goTo(slideIndex + 1);

  useEffect(() => {
    const id = setInterval(() => setSlideIndex((i) => (i + 1) % SLIDES.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slideIndex]);

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <div className="guest-page" data-theme="light">
      <div className="guest-container">
        <div className="left-side">
          <div className="slide-show" role="region" aria-label="Welcome slideshow">
            <div className="slide-show-track">
              {SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className={`slide-show-slide ${i === slideIndex ? "slide-show-slide-active" : ""}`}
                  aria-hidden={i !== slideIndex}
                >
                  {slide.image && (
                    <img src={slide.image.src} alt={slide.image.alt} className="slide-show-slide-img" />
                  )}
                  {slide.title && <h3 className="slide-show-slide-title">{slide.title}</h3>}
                  {slide.description && <p className="slide-show-slide-desc">{slide.description}</p>}
                </div>
              ))}
            </div>
            <div className="slide-show-controls">
              <button
                type="button"
                className="slide-show-btn slide-show-prev"
                onClick={goPrev}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <div className="slide-show-dots" role="tablist" aria-label="Slide index">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === slideIndex}
                    aria-label={`Slide ${i + 1}`}
                    className={`slide-show-dot ${i === slideIndex ? "slide-show-dot-active" : ""}`}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="slide-show-btn slide-show-next"
                onClick={goNext}
                aria-label="Next slide"
              >
                ›
              </button>
            </div>
          </div>
        </div>
        <div className="right-side">


          {isLogin ? <LoginForm /> : <RegisterForm />}
          
          
          
          <p className="component-toggle">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={toggleForm}>
              {isLogin ? "Sign up for free" : "Login"}
            </button>
          </p>
        </div></div></div>
  );
};

export default Auth;
