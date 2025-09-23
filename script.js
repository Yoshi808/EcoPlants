        document.addEventListener('DOMContentLoaded', function () {
            // Script para el desplazamiento suave
            const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            navLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    // Prevenir el comportamiento por defecto solo si no es un dropdown
                    if(this.getAttribute('href').startsWith('#')){
                        e.preventDefault();
                        let targetId = this.getAttribute('href');
                        let targetElement = document.querySelector(targetId);

                        if (targetElement) {
                            let navbarHeight = document.querySelector('.navbar').offsetHeight;
                            let targetPosition = targetElement.offsetTop - navbarHeight;
                            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                        }
                    }
                    // Cierra el menú hamburguesa en móvil
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarCollapse.classList.contains('show')) {
                        const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
                        bsCollapse.hide();
                    }
                });
            });

            // --- Lógica del Selector de Tema ---
            const getStoredTheme = () => localStorage.getItem('theme');
            const setStoredTheme = theme => localStorage.setItem('theme', theme);

            const getPreferredTheme = () => {
                const storedTheme = getStoredTheme();
                if (storedTheme) return storedTheme;
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            };

            const setTheme = theme => {
                let themeToSet = theme;
                if (theme === 'auto') {
                    themeToSet = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-bs-theme', themeToSet);
            };

            const showActiveTheme = (theme) => {
                const activeThemeIcon = document.querySelector('.theme-icon-active');
                const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);
                const iconClass = {
                    'light': 'bi-sun-fill',
                    'dark': 'bi-moon-stars-fill',
                    'auto': 'bi-circle-half'
                }[theme];

                document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.remove('active'));
                btnToActive.classList.add('active');
                activeThemeIcon.className = `bi ${iconClass} theme-icon-active my-1`;
            };

            const currentTheme = getPreferredTheme();
            setTheme(currentTheme);
            showActiveTheme(currentTheme);

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (getStoredTheme() === 'auto') {
                    const newTheme = getPreferredTheme();
                    setTheme(newTheme);
                    showActiveTheme(newTheme);
                }
            });

            document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const theme = toggle.getAttribute('data-bs-theme-value');
                    setStoredTheme(theme);
                    setTheme(theme);
                    showActiveTheme(theme);
                });
            });
        });