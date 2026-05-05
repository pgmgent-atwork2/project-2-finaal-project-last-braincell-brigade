const buttons = document.querySelectorAll("[data-theme]");

buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        const theme = btn.dataset.theme;

        document.body.classList.remove(
            "theme-dark",
            "theme-light"
        );

        document.body.classList.add(`theme-${theme}`);
    });
});