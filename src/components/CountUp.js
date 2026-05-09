import React, { useState, useEffect } from 'react';

const CountUp = ({ end, duration = 2000, suffix = '', className = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = 0;
    const endValue = parseInt(end);

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        const current = Math.floor(startValue + (endValue - startValue) * easeOutQuart(progress));
        setCount(current);
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    // Easing function for smooth animation
    const easeOutQuart = (x) => {
      return 1 - Math.pow(1 - x, 4);
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span className={className}>{count}{suffix}</span>;
};

export default CountUp;


