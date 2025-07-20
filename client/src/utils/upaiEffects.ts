// UPai Background Effects - Simple & Working Version

interface StarType {
  className: string;
  count: number;
}

interface FloatingElement {
  emoji: string;
  className: string;
}

// Create stars animation
export function createStars(): void {
  // Remove existing stars if any
  const existingStars = document.querySelector('.upai-stars');
  if (existingStars) {
    existingStars.remove();
  }

  // Create stars container
  const starsContainer: HTMLDivElement = document.createElement('div');
  starsContainer.className = 'upai-stars';
  starsContainer.id = 'upai-stars';

  const starTypes: StarType[] = [
    { className: 'small', count: 150 },
    { className: 'medium', count: 80 },
    { className: 'large', count: 50 },
    { className: 'bright', count: 20 }
  ];
  
  starTypes.forEach((type: StarType) => {
    for (let i = 0; i < type.count; i++) {
      const star: HTMLDivElement = document.createElement('div');
      star.className = `upai-star ${type.className}`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 5}s`;
      star.style.animationDuration = `${Math.random() * 3 + 2}s`;
      starsContainer.appendChild(star);
    }
  });

  // Add to body
  document.body.appendChild(starsContainer);
}

// Create floating elements
export function createFloatingElements(): void {
  // Remove existing floating elements if any
  const existing = document.querySelector('.upai-floating-elements');
  if (existing) {
    existing.remove();
  }

  // Create floating elements container
  const floatingContainer: HTMLDivElement = document.createElement('div');
  floatingContainer.className = 'upai-floating-elements';

  const elements: FloatingElement[] = [
    { emoji: '🚀', className: 'upai-rocket' },
    { emoji: '🧠', className: 'upai-brain' },
    { emoji: '🤖', className: 'upai-robot' },
    { emoji: '🔮', className: 'upai-satellite' }
  ];

  elements.forEach((element: FloatingElement) => {
    const div: HTMLDivElement = document.createElement('div');
    div.className = `upai-floating-element ${element.className}`;
    div.textContent = element.emoji;
    floatingContainer.appendChild(div);
  });

  // Add to body
  document.body.appendChild(floatingContainer);
}

// Add parallax effect
export function initParallaxEffect(): void {
  document.removeEventListener('mousemove', handleMouseMove);
  document.addEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e: MouseEvent): void {
  const elements = document.querySelectorAll<HTMLElement>('.upai-floating-element');
  const mouseX: number = e.clientX / window.innerWidth;
  const mouseY: number = e.clientY / window.innerHeight;
  
  elements.forEach((element: HTMLElement, index: number) => {
    const speed: number = (index + 1) * 0.5;
    const x: number = (mouseX - 0.5) * speed;
    const y: number = (mouseY - 0.5) * speed;
    
    element.style.transform = `translateX(${x}px) translateY(${y}px)`;
  });
}

// Initialize all UPai effects
export function initUPaiEffects(): void {
  // Check if we're on login page
  const isLoginPage = window.location.pathname.includes('login') || 
                     window.location.pathname === '/';
  
  if (isLoginPage) {
    // Add UPai body class
    document.body.classList.add('upai-background');
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
      createStars();
      createFloatingElements();
      initParallaxEffect();
    }, 100);
  }
}

// Clean up effects
export function cleanupUPaiEffects(): void {
  const starsContainer = document.querySelector('.upai-stars');
  const floatingContainer = document.querySelector('.upai-floating-elements');
  
  if (starsContainer) {
    starsContainer.remove();
  }
  
  if (floatingContainer) {
    floatingContainer.remove();
  }
  
  document.body.classList.remove('upai-background');
  document.removeEventListener('mousemove', handleMouseMove);
}