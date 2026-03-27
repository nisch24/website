// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {

    // 1. Mobile Menu Toggle
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('show');
        const icon = menuBtn.querySelector('i');
        if (navLinks.classList.contains('show')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('show');
            const icon = menuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // 2. Scroll Animation Observer
    const faders = document.querySelectorAll('.fade-in');
    
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('appear');
            appearOnScroll.unobserve(entry.target);
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // 3. Highlight Nav Menu on Scroll
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-item');

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Adjust to trigger exactly when reading
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').includes(current)) {
                item.classList.add('active');
            }
        });

        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // 4. Dynamic Duration Calculation
    const durations = document.querySelectorAll('.duration');
    durations.forEach(el => {
        const start = el.getAttribute('data-start');
        const end = el.getAttribute('data-end');
        if (!start) return;

        // Ensure dates are parsed correctly by appending -01 and appending 'T00:00:00' to avoid timezone shifts
        const startDate = new Date(start + "-01T00:00:00");
        let endDate = new Date();
        if (end && end.toLowerCase() !== 'present') {
            endDate = new Date(end + "-01T00:00:00");
        }

        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months -= startDate.getMonth();
        months += endDate.getMonth();
        months += 1;

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        let durationText = '';
        if (years > 0) {
            durationText += years + ' yr' + (years > 1 ? 's' : '');
        }
        if (remainingMonths > 0) {
            if (years > 0) durationText += ' ';
            durationText += remainingMonths + ' mo' + (remainingMonths > 1 ? 's' : '');
        }

        if (durationText) {
            el.textContent = `(${durationText})`;
        }
    });
});

