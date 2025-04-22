const inputs = document.querySelectorAll(".input-field");
const toggle_btn = document.querySelectorAll(".toggle");
const main = document.querySelector("main");
const bullets = document.querySelectorAll(".bullets span");
const images = document.querySelectorAll(".image");

inputs.forEach((inp) => {
  inp.addEventListener("focus", () => {
    inp.classList.add("active");
  });
  inp.addEventListener("blur", () => {
    if (inp.value != "") return;
    inp.classList.remove("active");
  });
});

toggle_btn.forEach((btn) => {
  btn.addEventListener("click", () => {
    main.classList.toggle("sign-up-mode");
  });
});

function moveSlider() {
  let index = this.dataset.value;
  
  let currentImage = document.querySelector(`.img-${index}`);
  images.forEach((img) => img.classList.remove("show"));
  currentImage.classList.add("show");

  const textSlider = document.querySelector(".text-group");
  let h2Height = document.querySelector(".text-group h2").offsetHeight; // Get dynamic height

  textSlider.style.transform = `translateY(${-(index - 1) * h2Height}px)`; // Correct calculation

  bullets.forEach((bull) => bull.classList.remove("active"));
  this.classList.add("active");
}

bullets.forEach((bullet) => {
  bullet.addEventListener("click", moveSlider);
});


// Function to update the sidebar header text



// document.addEventListener("DOMContentLoaded", function () {
//   console.log("Error handling script running...");

//   const urlParams = new URLSearchParams(window.location.search);
//   const error = urlParams.get('error');
//   const success = urlParams.get('success');

//   function showAlert(message, type) {
//       console.log("Creating alert:", message);

//       // Create alert div
//       const alertDiv = document.createElement("div");
//       alertDiv.className = `alert alert-${type} alert-dismissible fade show position-absolute top-0 start-50 translate-middle-x mt-3`;
//       alertDiv.setAttribute("role", "alert");
//       alertDiv.innerHTML = `
//           ${message}
//           <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
//       `;

//       // Append to body
//       document.body.appendChild(alertDiv);

//       // Auto remove after 5 seconds
//       setTimeout(() => {
//           alertDiv.remove();
//       }, 5000);
//   }

//   // Display error message
//   if (error) {
//       console.log("Error found in URL:", error);
//       showAlert(error, "danger");
//   }

//   // Display success message
//   if (success) {
//       console.log("Success found in URL:", success);
//       showAlert(success, "success");
//   }
// });
