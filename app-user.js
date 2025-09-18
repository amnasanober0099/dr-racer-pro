
function renderNavbarUser(){
  const user = JSON.parse(localStorage.getItem('arcade_current_user') || 'null');
  const wrap = document.getElementById('navUserWrap');
  const name = document.getElementById('navUserName');
  const loginLink = document.getElementById('navLoginLink');

  if(user){
    if(name) name.textContent = user.username;
    if(wrap) wrap.style.display = '';
    if(loginLink) loginLink.style.display = 'none';
  }else{
    if(wrap) wrap.style.display = 'none';
    if(loginLink) loginLink.style.display = '';
  }
}

// Run on load
document.addEventListener('DOMContentLoaded', renderNavbarUser);

// Logout handler
document.addEventListener('click', function(e){
  if(e.target.closest('#logoutBtn')){
    e.preventDefault();
    localStorage.removeItem('arcade_current_user');
    renderNavbarUser();
    if(!location.pathname.toLowerCase().includes('login')){
      location.href = 'login.html';
    }
  }
});

