const menuToggle = document.getElementById('menu-toggle');
const sideMenu = document.getElementById('side-menu');
const body = document.body;

function toggleMenu() {
  const icon = menuToggle.querySelector('i');
  sideMenu.classList.toggle('active');
  body.classList.toggle("menu-open");
  
  // Animate hamburger icon
  icon.classList.toggle('fa-bars');
  icon.classList.toggle('fa-xmark');
}

menuToggle.addEventListener('click', toggleMenu);

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (body.classList.contains('menu-open') && 
    !e.target.closest('#side-menu') && 
    !e.target.closest('#menu-toggle')) {
    toggleMenu();
  }
});

// Close menu on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && body.classList.contains('menu-open')) {
    toggleMenu();
  }
});


function openModal(modalId) {
  document.querySelector(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.querySelector(modalId).style.display = "none";
}

function openEditModal(button) {
  const productId = button.dataset.productId;
  const modal = document.getElementById(`editModal${productId}`);
  modal.style.display = "block";


}
