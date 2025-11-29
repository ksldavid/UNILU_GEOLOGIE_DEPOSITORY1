document.addEventListener('DOMContentLoaded', () => {
    const navHome = document.getElementById('nav-home');
    const navCourses = document.getElementById('nav-courses');
    const navSchedule = document.getElementById('nav-schedule');

    const homeSection = document.getElementById('home-section');
    const coursesSection = document.getElementById('courses-section');
    const scheduleSection = document.getElementById('schedule-section');
    const resultsSection = document.getElementById('results-section');
    const documentsSection = document.getElementById('documents-section');

    const navResults = document.getElementById('nav-results');
    const navDocuments = document.getElementById('nav-documents');

    const sidebarItems = document.querySelectorAll('.sidebar-nav li');

    function setActiveNav(activeItem) {
        sidebarItems.forEach(item => item.classList.remove('active'));
        activeItem.parentElement.classList.add('active');
    }

    function hideAllSections() {
        homeSection.style.display = 'none';
        coursesSection.style.display = 'none';
        if (scheduleSection) scheduleSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
        if (documentsSection) documentsSection.style.display = 'none';
    }

    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllSections();
            homeSection.style.display = 'block';
            setActiveNav(navHome);
        });
    }

    if (navCourses) {
        navCourses.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllSections();
            coursesSection.style.display = 'block';
            setActiveNav(navCourses);
        });
    }

    if (navSchedule) {
        navSchedule.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllSections();
            scheduleSection.style.display = 'block';
            setActiveNav(navSchedule);
        });
    }

    if (navResults) {
        navResults.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllSections();
            resultsSection.style.display = 'block';
            setActiveNav(navResults);
        });
    }

    if (navDocuments) {
        navDocuments.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllSections();
            documentsSection.style.display = 'block';
            setActiveNav(navDocuments);
        });
    }
});
