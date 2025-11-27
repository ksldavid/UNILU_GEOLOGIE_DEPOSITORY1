document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const roleBtns = document.querySelectorAll('.role-btn');
    const usernameLabel = document.getElementById('label-username');
    const usernameInput = document.getElementById('username');

    // --- Toggle Password Visibility ---
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle Icon
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // --- Role Switcher Logic ---
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            roleBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            // Update Form Context based on role
            const role = btn.dataset.role;
            if (role === 'student') {
                usernameLabel.textContent = 'Numéro Étudiant';
                usernameInput.placeholder = 'Ex: 202300123';
            } else {
                usernameLabel.textContent = 'Numéro Professeur';
                usernameInput.placeholder = 'Ex: PROF-2023-001';
            }

            // Optional: Add a subtle animation to the input to draw attention
            usernameInput.parentElement.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.02)' },
                { transform: 'scale(1)' }
            ], {
                duration: 200,
                easing: 'ease-in-out'
            });
        });
    });

    // --- Form Submission (Demo) ---
    // --- Form Submission (Demo) ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = loginForm.querySelector('.submit-btn');
        const originalContent = btn.innerHTML;

        // Loading State
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Connexion...';
        btn.style.opacity = '0.8';
        btn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Succès';
            btn.style.backgroundColor = '#2A9D8F'; // Ensure success color matches theme

            setTimeout(() => {
                // Determine active role
                const activeRole = document.querySelector('.role-btn.active').dataset.role;

                if (activeRole === 'student') {
                    window.location.href = 'student_dashboard.html';
                } else {
                    window.location.href = 'professor_dashboard.html';
                }
            }, 1000);
        }, 1500);
    });

    // --- Input Animation Effects ---
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
});
