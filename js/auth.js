function login() {
    const role = document.getElementById("role").value;

    if (role === "admin") window.location.href = "dashboard.html";
    if (role === "student") window.location.href = "student.html";
    if (role === "company") window.location.href = "company.html";
}
