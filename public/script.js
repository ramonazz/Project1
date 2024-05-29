document.addEventListener('DOMContentLoaded', function () {
    // Variables for modals
    const addMoneyBtn = document.getElementById('addMoneyBtn');
    const modal = document.getElementById('myModal');
    const exchangeBtn = document.querySelector('.exchange-btn');
    const exchangeModal = document.getElementById('exchangeModal');
    const closeModalButtons = document.querySelectorAll('.close');

    // Variables for currency selection
    const currencySelect = document.getElementById('currencySelect');
    const ronBalance = document.getElementById('ronBalance');
    const usdBalance = document.getElementById('usdBalance');
    const eurBalance = document.getElementById('eurBalance');

    // Variables for transaction expansion
    const expandButton = document.querySelector('.expand-button');
    const lessButton = document.querySelector('.less-button');
    const hiddenTransactions = document.querySelectorAll('.transaction.hidden');

    // Variables for sidebar navigation (if applicable)
    const sidebarItems = document.querySelectorAll(".sidebar ul li a");
    const contentSections = document.querySelectorAll(".content-container .content-section");

    // Show RON balance by default
    ronBalance.style.display = 'block';
    usdBalance.style.display = 'none';
    eurBalance.style.display = 'none';

    // Currency selection logic
    currencySelect.addEventListener('change', function () {
        const selectedCurrency = currencySelect.value;
        if (selectedCurrency === 'ron') {
            ronBalance.style.display = 'block';
            usdBalance.style.display = 'none';
            eurBalance.style.display = 'none';
        } else if (selectedCurrency === 'usd') {
            ronBalance.style.display = 'none';
            usdBalance.style.display = 'block';
            eurBalance.style.display = 'none';
        } else if (selectedCurrency === 'eur') {
            ronBalance.style.display = 'none';
            usdBalance.style.display = 'none';
            eurBalance.style.display = 'block';
        }
    });

    // Modals open and close logic
    addMoneyBtn.addEventListener('click', function () {
        modal.style.display = 'block';
    });

    exchangeBtn.addEventListener('click', function () {
        exchangeModal.style.display = 'block';
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', function () {
            modal.style.display = 'none';
            exchangeModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        } else if (event.target === exchangeModal) {
            exchangeModal.style.display = 'none';
        }
    });

    // Add Money form submission logic
    const addMoneyForm = document.querySelector('#myModal form');
    addMoneyForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const amount = document.getElementById('amount').value;
        const currency = document.getElementById('currency').value;

        fetch('/auth/add-money', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, currency })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.message === "Money added successfully") {
                modal.style.display = 'none';
                window.location.href = '/auth/index';
                updateBalanceDisplay(amount, currency);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Exchange Money form submission logic
    const exchangeForm = document.getElementById('exchangeForm');
    exchangeForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const amount = document.getElementById('exchangeAmount').value;
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;

        fetch('/auth/exchange-money', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, fromCurrency, toCurrency })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.message === "Money exchanged successfully") {
                exchangeModal.style.display = 'none';
                window.location.href = '/auth/index';
                updateBalanceDisplay(data.exchangedAmount, toCurrency); // Use data.exchangedAmount
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Function to update balance display
    function updateBalanceDisplay(amount, currency) {
        let balanceElement;
        if (currency.toLowerCase() === 'ron') {
            balanceElement = ronBalance;
        } else if (currency.toLowerCase() === 'usd') {
            balanceElement = usdBalance;
        } else if (currency.toLowerCase() === 'eur') {
            balanceElement = eurBalance;
        }

        if (balanceElement) {
            balanceElement.textContent = `${currency.toUpperCase()} Balance: ${amount}`;
        }
    }

    // Transaction history expand/collapse logic
    expandButton.addEventListener('click', function () {
        hiddenTransactions.forEach(transaction => {
            transaction.classList.remove('hidden');
        });
        expandButton.style.display = 'none'; // Hide the "More" button after clicking
        lessButton.style.display = 'block'; // Show the "Less" button after revealing all transactions
    });

    lessButton.addEventListener('click', function () {
        hiddenTransactions.forEach(transaction => {
            transaction.classList.add('hidden');
        });
        lessButton.style.display = 'none'; // Hide the "Less" button after clicking
        expandButton.style.display = 'block'; // Show the "More" button after hiding extra transactions
    });

    // Sidebar navigation logic (if applicable)
    sidebarItems.forEach(item => {
        item.addEventListener("click", function(event) {
            event.preventDefault();
            const target = event.target.getAttribute("data-target");
            showContent(target);
        });
    });

    function showContent(target) {
        contentSections.forEach(section => {
            if (section.getAttribute("id") === target) {
                section.classList.remove("hidden");
            } else {
                section.classList.add("hidden");
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const sidebarItems = document.querySelectorAll(".sidebar ul li a");
    const contentSections = document.querySelectorAll(".content-container .content-section");

    sidebarItems.forEach(item => {
        item.addEventListener("click", function(event) {
            event.preventDefault();
            const target = event.target.getAttribute("data-target");
            showContent(target);
        });
    });

    function showContent(target) {
        contentSections.forEach(section => {
            if (section.getAttribute("id") === target) {
                section.classList.remove("hidden");
            } else {
                section.classList.add("hidden");
            }
        });
    }
});