(function (window) {
    const PerfSuarez = window.PerfSuarez || {
        core: {},
        models: {},
        views: {},
        viewmodels: {},
        state: {}
    };

    PerfSuarez.core.onReady = function onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
            return;
        }
        callback();
    };

    PerfSuarez.core.normalizeRoutePath = function normalizeRoutePath(path) {
        if (!path) {
            return '/index.html';
        }

        let normalized = path.replace(/\/+/g, '/');
        if (!normalized.startsWith('/')) {
            normalized = `/${normalized}`;
        }
        if (normalized === '/' || normalized === '') {
            return '/index.html';
        }
        if (normalized.endsWith('/')) {
            return `${normalized}index.html`;
        }
        return normalized;
    };

    PerfSuarez.core.resolvePath = function resolvePath(value, baseHref) {
        if (!value) {
            return '';
        }

        if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) {
            return value;
        }

        try {
            return new URL(value, baseHref || window.location.href).href;
        } catch (error) {
            return value;
        }
    };

    PerfSuarez.core.openWhatsApp = function openWhatsApp(number, message, target) {
        const url = `https://wa.me/${number}/?text=${encodeURIComponent(message)}`;
        window.open(url, target || '_blank', 'noopener');
        return url;
    };

    PerfSuarez.core.confirmAndOpenWhatsApp = function confirmAndOpenWhatsApp(options) {
        const confirmation = window.confirm(options.confirmationMessage);
        if (!confirmation) {
            return false;
        }

        PerfSuarez.core.openWhatsApp(options.number, options.message, options.target);
        return true;
    };

    window.PerfSuarez = PerfSuarez;
})(window);
