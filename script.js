// Carousel functionality
let currentSlides = {
    '2023': 0,
    '2024': 0,
    '2025': 0
};

function moveCarousel(year, direction) {
    const carousel = document.querySelector(`[data-carousel="${year}"]`);
    const items = carousel.querySelectorAll('.carousel-item');
    const indicators = carousel.querySelectorAll('.indicator');
    
    // Remove active class from current slide
    items[currentSlides[year]].classList.remove('active');
    indicators[currentSlides[year]].classList.remove('active');
    
    // Calculate new slide index
    currentSlides[year] += direction;
    
    // Loop around
    if (currentSlides[year] >= items.length) {
        currentSlides[year] = 0;
    } else if (currentSlides[year] < 0) {
        currentSlides[year] = items.length - 1;
    }
    
    // Add active class to new slide
    items[currentSlides[year]].classList.add('active');
    indicators[currentSlides[year]].classList.add('active');
}

function showSlide(year, index) {
    const carousel = document.querySelector(`[data-carousel="${year}"]`);
    const items = carousel.querySelectorAll('.carousel-item');
    const indicators = carousel.querySelectorAll('.indicator');
    
    // Remove active class from current slide
    items[currentSlides[year]].classList.remove('active');
    indicators[currentSlides[year]].classList.remove('active');
    
    // Set new slide
    currentSlides[year] = index;
    
    // Add active class to new slide
    items[currentSlides[year]].classList.add('active');
    indicators[currentSlides[year]].classList.add('active');
}

// Auto-play carousels
function autoPlayCarousels() {
    Object.keys(currentSlides).forEach(year => {
        if (document.querySelector(`[data-carousel="${year}"]`)) {
            moveCarousel(year, 1);
        }
    });
}

// Start auto-play only when carousels exist on this page
const carouselEls = document.querySelectorAll('.carousel');
let autoPlayInterval;
if (carouselEls.length > 0) {
    autoPlayInterval = setInterval(autoPlayCarousels, 5000);

    // Pause auto-play on hover
    carouselEls.forEach(carousel => {
        carousel.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });

        carousel.addEventListener('mouseleave', () => {
            autoPlayInterval = setInterval(autoPlayCarousels, 5000);
        });
    });
}

// FAQ functionality
function toggleFAQ(button) {
    const faqItem = button.parentElement;
    const wasActive = faqItem.classList.contains('active');
    
    // Close all FAQ items in the same section
    const allFAQItems = faqItem.closest('.faq-section').querySelectorAll('.faq-item');
    allFAQItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle the clicked item (unless it was already active)
    if (!wasActive) {
        faqItem.classList.add('active');
    }
}

// Smooth scroll for anchor links (if needed in the future)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    // Add initial styles for animation
    const animatedElements = document.querySelectorAll('.event-card, .faq-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground && scrolled < window.innerHeight) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Create placeholder images if they don't exist (for development)
function createPlaceholderImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            // Create a canvas placeholder
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');
            
            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#2a2a2a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add text
            ctx.fillStyle = 'rgba(211, 55, 65, 0.5)';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VRTon', canvas.width / 2, canvas.height / 2 - 30);
            ctx.font = '24px Arial';
            ctx.fillText('Image Placeholder', canvas.width / 2, canvas.height / 2 + 30);
            
            this.src = canvas.toDataURL();
        });
    });
}

// Initialize placeholder images
createPlaceholderImages();

// Button click handlers (placeholder - connect to actual functionality later)
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            
            const rect = this.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
            
            // Log action (replace with actual navigation/modal later)
            console.log(`${this.textContent} button clicked`);
        });
    });
});

// Add ripple animation keyframe
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            width: 300px;
            height: 300px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
