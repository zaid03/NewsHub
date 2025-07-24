export function setupSidebarLogic() {
    const out = document.getElementById("out");
    if (out) {
        out.addEventListener("click", function (event) {
            event.preventDefault();
            sessionStorage.removeItem("user_id");
            window.location.href = "../src/components/login.html";
        });
    }
}