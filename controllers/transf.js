const mysql = require("mysql");
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jbje7Vc91jmXA8Ft',
    database: 'online_banking'
});

exports.addMoney = (req, res) => {
    const { amount, currency } = req.body;
    const username = req.session.username; // Retrieve username from session

    // Validate the amount
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    // Update the user's account balance in the database based on the username
    const updateBalanceQuery = `UPDATE accounts SET balance_${currency} = balance_${currency} + ? WHERE user_id = (SELECT id FROM users WHERE username = ?)`;
    db.query(updateBalanceQuery, [amount, username], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: "An error occurred while adding money" });
        }

        

        db.query('SELECT balance_ron, balance_usd, balance_eur FROM accounts WHERE user_id = (SELECT id FROM users WHERE username = ?)', [username], (balanceError, balanceResults) => {
            if (balanceError) {
                console.log(balanceError);
                return res.status(500).json({ message: "An error occurred while retrieving updated balances" });
            }
            
            

            const updatedBalances = balanceResults[0];
            res.status(200).json({ message: "Money added successfully", balances: updatedBalances });
        });

    });
    
}


exports.transferMoney = (req, res) => {
    const { recipient, amount, currency } = req.body;
    const sender = req.session.username; // Retrieve sender's username from session
    let senderId; // Define senderId here

    // Validate the amount
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    // Check if sender has sufficient balance
    db.query('SELECT id FROM users WHERE username = ?', sender, (error, senderResults) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: "An error occurred while checking sender's balance" });
        }

        senderId = senderResults[0].id; // Assign value to senderId

        // Fetch sender's account balances
        db.query('SELECT * FROM accounts WHERE user_id = ?', senderId, (error, senderAccountResults) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "An error occurred while fetching sender's account balances" });
            }

            const senderBalances = senderAccountResults[0];

            // Determine sender's balance in the specified currency
            const senderBalance = senderBalances[`balance_${currency.toLowerCase()}`];

            if (!senderBalance || senderBalance < amount) {
                return res.status(400).json({ message: "Insufficient balance" });
            }

            // Fetch recipient's ID
            db.query('SELECT id FROM users WHERE username = ?', recipient, (error, recipientResults) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: "An error occurred while fetching recipient's ID" });
                }

                const recipientId = recipientResults[0].id;

                // Fetch recipient's account balances
                db.query('SELECT * FROM accounts WHERE user_id = ?', recipientId, (error, recipientAccountResults) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).json({ message: "An error occurred while fetching recipient's account balances" });
                    }

                    const recipientBalances = recipientAccountResults[0];

                    // Determine recipient's balance in the specified currency
                    const recipientBalance = recipientBalances[`balance_${currency.toLowerCase()}`];

                    // Update sender's balance
                    const updateSenderQuery = `UPDATE accounts SET balance_${currency.toLowerCase()} = ? WHERE user_id = ?`;
                    const updatedSenderBalance = senderBalance - amount;

                    db.query(updateSenderQuery, [updatedSenderBalance, senderId], (error, results) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).json({ message: "An error occurred while updating sender's balance" });
                        }

                        // Update recipient's balance
                        const updateRecipientQuery = `UPDATE accounts SET balance_${currency.toLowerCase()} = ? WHERE user_id = ?`;
                        const updatedRecipientBalance = recipientBalance + amount;

                        db.query(updateRecipientQuery, [updatedRecipientBalance, recipientId], (error, results) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).json({ message: "An error occurred while updating recipient's balance" });
                            }

                            // Record the transaction for sender
                            const insertSenderTransactionQuery = `
                                INSERT INTO transactions 
                                (user_id, transaction_type, amount, recipient, date) 
                                VALUES (?, ?, ?, ?, NOW())`;

                            db.query(insertSenderTransactionQuery, [senderId, 'Transfer', -amount, recipient, new Date()], (error, results) => {
                                if (error) {
                                    console.log(error);
                                    return res.status(500).json({ message: "An error occurred while recording transaction for sender" });
                                }

                                // Record the transaction for recipient
                                const insertRecipientTransactionQuery = `
                                    INSERT INTO transactions 
                                    (user_id, transaction_type, amount, recipient, date) 
                                    VALUES (?, ?, ?, ?, NOW())`;

                                db.query(insertRecipientTransactionQuery, [recipientId, 'Transfer', amount, sender, new Date()], (error, results) => {
                                    if (error) {
                                        console.log(error);
                                        return res.status(500).json({ message: "An error occurred while recording transaction for recipient" });
                                    }

                                    // Redirect back to the previous page
                                    res.redirect('/transfers');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};




exports.payBill = (req, res) => {
    const { billType, billRecipient, accountNumber, billAmount, dueDate, currency, reference } = req.body;
    const sender = req.session.username; // Retrieve sender's username from session

    // Validate the bill amount
    if (!billAmount || isNaN(billAmount) || billAmount <= 0) {
        return res.status(400).json({ message: "Invalid bill amount" });
    }

    // Get the sender's user ID
    db.query('SELECT id FROM users WHERE username = ?', [sender], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: "An error occurred while retrieving sender's information" });
        }

        const userId = results[0].id;

        // Fetch sender's account balances
        db.query('SELECT * FROM accounts WHERE user_id = ?', [userId], (error, senderAccountResults) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "An error occurred while fetching sender's account balances" });
            }

            const senderBalances = senderAccountResults[0];

            // Determine sender's balance in the specified currency
            const balanceField = `balance_${currency.toLowerCase()}`;
            const senderBalance = senderBalances[balanceField];

            if (!senderBalance || senderBalance < billAmount) {
                return res.status(400).json({ message: "Insufficient balance" });
            }

            // Start the transaction
            db.beginTransaction((error) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: "An error occurred while starting transaction" });
                }

                // Deduct bill amount from sender's balance
                const updateSenderQuery = `UPDATE accounts SET ${balanceField} = ? WHERE user_id = ?`;
                const updatedSenderBalance = senderBalance - billAmount;

                db.query(updateSenderQuery, [updatedSenderBalance, userId], (error) => {
                    if (error) {
                        return db.rollback(() => {
                            console.log(error);
                            return res.status(500).json({ message: "An error occurred while deducting money from sender" });
                        });
                    }

                    // Record the bill payment
                    db.query('INSERT INTO bill_payments (user_id, bill_type_id, recipient, account_number, amount, due_date, reference) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                              [userId, billType, billRecipient, accountNumber, billAmount, dueDate, reference], 
                              (error) => {
                        if (error) {
                            return db.rollback(() => {
                                console.log(error);
                                return res.status(500).json({ message: "An error occurred while recording bill payment" });
                            });
                        }

                        // Insert transaction record for bill payment
                        db.query('INSERT INTO transactions (user_id, transaction_type, amount, recipient, date) VALUES (?, ?, ?, ?, NOW())', 
                                  [userId, 'Bill Payment', -billAmount, billRecipient], 
                                  (error) => {
                            if (error) {
                                return db.rollback(() => {
                                    console.log(error);
                                    return res.status(500).json({ message: "An error occurred while recording transaction for bill payment" });
                                });
                            }

                            // Commit the transaction
                            db.commit((error) => {
                                if (error) {
                                    return db.rollback(() => {
                                        console.log(error);
                                        return res.status(500).json({ message: "An error occurred while committing transaction" });
                                    });
                                }

                                res.redirect('/transfers');
                            });
                        });
                    });
                });
            });
        });
    });
};



exports.exchangeMoney = (req, res) => {
    const { amount, fromCurrency, toCurrency } = req.body;
    const username = req.session.username; // Get the username from the session

    if (!username) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Query to retrieve the user's ID based on the username
    const getUserIdQuery = "SELECT id FROM users WHERE username = ?";
    
    db.query(getUserIdQuery, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user ID:', err);
            return res.status(500).json({ message: "An error occurred while fetching user ID" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = results[0].id;

        const getExchangeRateQuery = `
            SELECT rate FROM exchange_rates 
            WHERE base_currency = ? AND target_currency = ? 
            ORDER BY last_updated DESC LIMIT 1`;

        db.query(getExchangeRateQuery, [fromCurrency, toCurrency], (err, results) => {
            if (err) {
                console.error('Error fetching exchange rate:', err);
                return res.status(500).json({ message: "An error occurred while fetching exchange rate" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Exchange rate not found" });
            }

            const exchangeRate = results[0].rate;
            const exchangedAmount = amount * exchangeRate;
            const fee = exchangedAmount * 0.01; // Assuming a 1% fee for the transaction
            const finalExchangedAmount = exchangedAmount - fee;

            const updateAccountQuery = `
                UPDATE accounts 
                SET balance_${fromCurrency.toLowerCase()} = balance_${fromCurrency.toLowerCase()} - ?, 
                    balance_${toCurrency.toLowerCase()} = balance_${toCurrency.toLowerCase()} + ? 
                WHERE user_id = ?`;

            db.query(updateAccountQuery, [amount, finalExchangedAmount, userId], (err) => {
                if (err) {
                    console.error('Error updating account balances:', err);
                    return res.status(500).json({ message: "An error occurred while updating account balances" });
                }

                const insertTransactionQuery = `
                    INSERT INTO currency_exchange_transactions 
                    (from_currency, to_currency, exchange_rate, amount, exchanged_amount, fee, transaction_date) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

                db.query(insertTransactionQuery, [fromCurrency, toCurrency, exchangeRate, amount, finalExchangedAmount, fee], (err) => {
                    if (err) {
                        console.error('Error recording transaction:', err);
                        
                    }

                    res.json({ message: "Money exchanged successfully", exchangedAmount: finalExchangedAmount });
                });
            });
        });
    });
};



