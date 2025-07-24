const urlParams = new URLSearchParams(window.location.search);
const user_id = urlParams.get('user_id');
console.log('User ID from URL:', user_id);
const finalUserId = user_id;

document.getElementById("preferences-form").addEventListener("submit", async function (e){
    e.preventDefault();

    if(!finalUserId){
        console.error("user_id not found.");
        const submiterror = document.getElementById("submiterror");
        submiterror.style.color = "red";
        submiterror.textContent = "Erreur de connexion, veuillez vous reconnecter.";
        return
    }

    const selectednotifications = Array.from(document.querySelectorAll('input[name="notifications"]:checked')).map(checkbox => checkbox.value);
    console.log(selectednotifications);

    if(selectednotifications.length === 0){
        document.getElementById("submiterror").style.color = "red";
        document.getElementById("submiterror").textContent = "Sélectionnez au moins un type de notification";
        return;
    }

    try{
        const response = await fetch('http://localhost:3000/api/notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: finalUserId,
                notifications: selectednotifications
            }),
        });

        const data = await response.json();
        console.log("Réponse serveur:", data);

        if(data.success){
            console.log("Notifications enregistrées avec succès !");
            window.location.href = './login.html';
        }else{
            document.getElementById("submiterror").textContent = data.message || "Une erreur s'est produite.";
            document.getElementById("submiterror").style.color = "red";
        }
        
    }catch (error){
        console.error("Error during notification submission:", error);
        document.getElementById("submiterror").textContent = "Erreur interne du serveur.";
        document.getElementById("submiterror").style.color = "red";
    }
});