const express = require('express');
const authController = require('../controllers/auth');
const transfController = require('../controllers/transf');
const logoutController = require('../controllers/auth');
const router = express.Router();
const mysql = require("mysql");

const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jbje7Vc91jmXA8Ft',
    database: 'online_banking'
});

router.post('/register', authController.register);
router.post('/login', authController.login, (req, res) => {
    res.redirect('/index'); 
});
router.post("/logout", logoutController.logout);
router.post('/add-money', transfController.addMoney);
router.post('/transfer-money', transfController.transferMoney);
router.post('/update-account', authController.updateAccount);
router.post('/pay-bill', transfController.payBill);

router.post('/exchange-money', transfController.exchangeMoney); // Add this route

router.get("/index", (req, res) => {
    const username = req.session.username;
    if (!username) {
        console.log("Username not found in session. Redirecting to login.");
        return res.redirect("/login");
    }

    console.log(`Fetching balance for user: ${username}`);

    const userQuery = "SELECT id FROM users WHERE username = ?";
    db.query(userQuery, [username], (userErr, userResult) => {
        if (userErr) {
            console.error("Error retrieving user information:", userErr);
            return res.status(500).json({ message: "An error occurred while retrieving user information" });
        }

        if (userResult.length === 0) {
            console.log("No account found for the logged-in user.");
            return res.send("No account found for the logged-in user");
        }

        const userId = userResult[0].id;
        console.log(`User ID for ${username}: ${userId}`);

        const balanceQuery = "SELECT balance_ron, balance_usd, balance_eur FROM accounts WHERE user_id = ?";
        db.query(balanceQuery, [userId], (balanceErr, balanceResult) => {
            if (balanceErr) {
                console.error("Error retrieving balances:", balanceErr);
                return res.status(500).json({ message: "An error occurred while retrieving balances" });
            }

            if (balanceResult.length === 0) {
                console.log(`No balances found for user ID: ${userId}`);
                return res.send("No balances found for the user");
            }

            const balances = balanceResult[0];
            console.log(`Balances for user ${username}:`, balances);

            const transactionQuery = "SELECT transaction_type, amount, recipient, date FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 10";
            db.query(transactionQuery, [userId], (transactionErr, transactionResult) => {
                if (transactionErr) {
                    console.error("Error retrieving recent transactions:", transactionErr);
                    return res.status(500).json({ message: "An error occurred while retrieving recent transactions" });
                }

                const transactions = transactionResult.map(transaction => ({
                    transaction_type: transaction.transaction_type,
                    amount: transaction.amount,
                    recipient: transaction.recipient,
                    date: transaction.date,
                }));

                res.render("index", { username, balances, transactions });
            });
        });
    });
});

router.get("/cards", (req, res) => {
    const username = req.session.username;
    if (!username) {
      console.log("Username not found in session. Redirecting to login.");
      return res.redirect("/login");
    }
  
    console.log(`Fetching card details for user: ${username}`);
  
    const userQuery =
      "SELECT cardNumber, signature, cardHolder FROM users WHERE username = ?";
    db.query(userQuery, [username], (userErr, userResult) => {
      if (userErr) {
        console.error("Error retrieving card details:", userErr);
        return res.status(500).json({
          message: "An error occurred while retrieving card details",
        });
      }
  
      if (userResult.length === 0) {
        console.log("No card details found for the logged-in user.");
        return res.send("No card details found for the logged-in user");
      }
  
      const cardNumber = userResult[0].cardNumber;
      const signature = userResult[0].signature;
      const cardHolder = userResult[0].cardHolder;
  
      res.render("cards", {
        cardNumber,
        signature,
        cardHolder,
      });
    });
  });
  

  router.get("/menu", (req, res) => {
    const username = req.session.username; // Retrieve username from session
    if (!username) {
      console.log("Username not found in session. Redirecting to login.");
      return res.redirect("/login"); // Redirect to login page if username is not set in the session
    }
  
    // Fetch current balance and user ID
    const userQuery = "SELECT id FROM users WHERE username = ?";
    db.query(userQuery, [username], (userErr, userResult) => {
      if (userErr) {
        console.error("Error retrieving user information:", userErr);
        return res.status(500).json({
          message: "An error occurred while retrieving user information",
        });
      }
  
      if (userResult.length === 0) {
        console.log("No account found for the logged-in user.");
        return res.send("No account found for the logged-in user");
      }
  
      const userId = userResult[0].id;
  
      // Fetch user details using user ID
      const accountQuery =
        "SELECT email, address, firstName, lastName, dateOfBirth FROM users WHERE id = ?";
      db.query(accountQuery, [userId], (accountErr, accountResult) => {
        if (accountErr) {
          console.error("Error retrieving account information:", accountErr);
          return res.status(500).json({
            message: "An error occurred while retrieving account information",
          });
        }
  
        if (accountResult.length === 0) {
          console.log("No account found for the logged-in user.");
          return res.send("No account found for the logged-in user");
        }
  
        const userDetails = accountResult[0];
  
        res.render("menu", { username, userDetails });
      });
    });
  });
  

  
module.exports = router;
