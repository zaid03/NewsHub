document.getElementById("signform").addEventListener("submit", async function(e){
  e.preventDefault();
  const utilisateurr = document.getElementById("utilisateurr").value.trim().toLowerCase();
  const email = document.getElementById("email-two").value.trim().toLowerCase();
  const gender = document.getElementById("gender").value.trim().toLowerCase();
  const motdepasss = document.getElementById("motdepasss").value.trim().toLowerCase();

  console.log('Form values:', { utilisateurr, email, motdepasss});

  const errorFields = [
    "utilisateurrerrorr",
    "twoemailerror",
    "gendererror",
    "motdepassserror",
  ];

  errorFields.forEach((field) => {
    const errorSpan = document.getElementById(`${field}error`);
    if (errorSpan) {
      errorSpan.textContent = "";
    }
  });

  try{
    const response = await fetch('http://localhost:3000/api/sign', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({utilisateurr, email, gender, motdepasss}),
    });
    console.log('Raw response:', response);
    const data = await response.json();
    console.log('Parsed response data:', data);

    if (data.success){
      sessionStorage.setItem("user_id", data.user_id);
      console.log('User ID received from backend:', data.user_id);
      console.log('User ID stored in sessionStorage:', sessionStorage.getItem("user_id"));
      setTimeout(() => {
        window.location.href = `http://localhost:3000/components/preference.html?user_id=${data.user_id}`;
      }, 500)
    }else{
      if (data.errors) {
        for (const field in data.errors) {
          const errorSpan = document.getElementById(`${field}error`);
          if (errorSpan) {
            errorSpan.textContent = data.errors[field];
            errorSpan.style.color = "red";
          }else {
            console.warn(`No span found for field: ${field}`);
          }
        }
    } else {
        const check = document.getElementById("check");
        check.textContent = data.message || "Une erreur s'est produite.";
        check.style.color = "red";
      }
    }
  }catch(error){
    console.error("Error during sign-up:", error);
    const check = document.getElementById("check");
    check.textContent = "Erreur interne du serveur.";
    check.style.color = "red";
  }
});