const $=s=>document.querySelector(s);
const menu=$('#mobileMenu'),sidebar=$('#sidebar');
menu?.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
document.querySelectorAll('.main-nav a').forEach(link=>link.addEventListener('click',()=>{sidebar.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation')}));
