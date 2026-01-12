// Line Chart
new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
        labels: ["2020", "2021", "2022", "2023", "2024"],
        datasets: [
            {
                label: "Placed",
                data: [20, 28, 25, 32, 38],
                borderColor: "#22c55e",
                fill: false
            },
            {
                label: "Not Placed",
                data: [10, 15, 12, 18, 22],
                borderColor: "#f97316",
                fill: false
            }
        ]
    }
});

// Donut Chart
new Chart(document.getElementById("donutChart"), {
    type: "doughnut",
    data: {
        labels: ["Infosys", "TCS", "Others"],
        datasets: [{
            data: [40, 30, 30],
            backgroundColor: ["#22c55e", "#6366f1", "#f97316"]
        }]
    }
});
