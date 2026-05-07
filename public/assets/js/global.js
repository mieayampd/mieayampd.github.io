/**
 * Global scripts for Mie Ayam Pak Dul
 * Includes title changer on visibility change
 */

document.addEventListener('DOMContentLoaded', function() {
    const pageTitle = document.title;
    document.addEventListener('visibilitychange', () => {
        const isHidden = document.hidden;
        if (isHidden) {
            document.title = '🥺 Come back';
        } else {
            document.title = pageTitle;
        }
    });
});
