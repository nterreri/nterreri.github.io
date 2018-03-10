'use strict';

(function() {

if (window.nt) {
    return;
}

function hasCookiesConsent() {
    return !localStorage.getItem('no-consent');
}

function cookieBannerAcknowledged() {
    return localStorage.getItem('cookies-acknowledged');
}

function showCookiesBanner() {
    const consentHeader = document.createElement('div');
    consentHeader.setAttribute('class', 'nt-consent');

    const message =
        'This websites uses cookies to gather information such as the number of visitors and which blog posts are popular. By continuing to use this website you consent to the use of cookies for these purposes.';
    const messageNode = document.createElement('span');
    messageNode.setAttribute('class', 'nt-consent__message');
    messageNode.textContent = message;

    const cookiePolicyLink = document.createElement('a');
    cookiePolicyLink.setAttribute('href', '/privacy');
    cookiePolicyLink.setAttribute('class', 'nt-consent__link');
    const cookiePolicyLinkLabel = document.createElement('span');
    cookiePolicyLinkLabel.setAttribute('class', 'nt-consent__link-label');
    cookiePolicyLinkLabel.textContent = 'Read more';
    cookiePolicyLink.appendChild(cookiePolicyLinkLabel);
    messageNode.appendChild(cookiePolicyLink);

    const okButton = document.createElement('button');
    okButton.setAttribute('class', 'nt-consent__ok-button');
    okButton.textContent = 'OK';
    okButton.onclick = handleOkClick;

    consentHeader.appendChild(messageNode);
    consentHeader.appendChild(okButton);

    document.body.appendChild(consentHeader);
    document.getElementsByTagName('header')[0].setAttribute('class', 'nt-header--with-consent');
}

function handleOkClick(e) {
    localStorage.setItem('cookies-acknowledged', true);

    document.getElementsByTagName('header')[0].setAttribute('class', 'nt-header');
    const consentHeaderClassname = e.target.parentNode.className;
    e.target.parentNode.setAttribute('class', `${consentHeaderClassname} nt-consent--hiding`);

    setTimeout(() => e.target.parentNode.remove(), 2000);
}

function trackPageHit() {
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'UA-114389878-1');
}

window.nt = {
    hasCookiesConsent,
    cookieBannerAcknowledged,
    showCookiesBanner,
    trackPageHit
};

})();
