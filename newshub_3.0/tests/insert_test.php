<?php 
include 'C:/2.me_codes/1.Project _Fin_Etude/contento v2.0/src/php/connect.php';

$prenom = 'John';
$nom = 'Doe';
$genre = 'Male';
$naisasnce = '1990-01-01';
$email = 'john.doe@example.com';
$motdepass = 'password123';
$pays = 'USA';
$ville = 'New York';

$insert = mysqli_query($conn, "INSERT INTO sign (prenom, nom, genre, naissance, email, motdepass, pays, ville) VALUES ('$prenom', '$nom', '$genre', '$naisasnce', '$email', '$motdepass', '$pays', '$ville')");

if ($insert) {
    echo "Insertion successful!";
} else {
    echo "Insertion failed: " . mysqli_error($conn);
}
?>