const container = document.getElementById('cont');
const registerbtn = document.getElementById('register');
const loginbtn = document.getElementById('login');

registerbtn.addEventListener('click', () => {
	container.classList.add('active');
});

loginbtn.addEventListener('click', () => {
	container.classList.remove('active');
});

/*forgotten password page is yet to be finished*/
document.getElementById('login-form').addEventListener("submit", async (e) => {
    e.preventDefault();

    const utilisateur = document.getElementById("utilisateur").value;
    const motdepass = document.getElementById("motdepass").value;
    document.getElementById("utilisateurerror").textContent = "";
    document.getElementById("motdepasserror").textContent = "";

    try{
        console.log('Request body:', {utilisateur, motdepass});
        const response = await fetch ('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({utilisateur, motdepass}),
        });
        const data = await response.json();
        console.log('Login response:', data); 
        if (data.success){
            sessionStorage.setItem("user_id", data.user_id);
            sessionStorage.setItem("nom", data.nom);
            sessionStorage.setItem("gender", data.gender);
            window.location.href = '../index.html';
        }else{
            if (data.message.includes("nom")) {
                utilisateurerror.textContent = data.message;
                utilisateurerror.style.color = 'red';
            } else if (data.message.includes("Mot de passe")) {
                motdepasserror.textContent = data.message;
                motdepasserror.style.color = 'red';
            } else {
                utilisateurerror.textContent = data.message;
                utilisateurerror.style.color = 'red';
            }
        }
    }catch(error){
        console.error('error during login:', error);
        alert('error interne du server.');
    }
});