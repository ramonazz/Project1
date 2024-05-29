const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jbje7Vc91jmXA8Ft',
    database:'online_banking'
});

function generateCardNumber() {
    let cardNumber = "";
    for (let i = 0; i < 16; i++) {
      cardNumber += Math.floor(Math.random() * 10);
    }
    return cardNumber;
  }
  function generateSignature() {
    return Math.floor(100 + Math.random() * 900).toString();
  }

function isPasswordValid(password) {
    // Password must contain at least 6 characters, including at least one uppercase letter, one lowercase letter, and one number.
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
    return passwordRegex.test(password);
}

function isValidPhoneNumber(phone) {
    // Regular expression to validate phone numbers (10 digits)
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
}

function isValidCNP(cnp) {
    // Regular expression to validate CNPs (13 digits)
    const cnpRegex = /^\d{13}$/;
    return cnpRegex.test(cnp);
}


exports.register = (req, res) => {
    console.log(req.body);

    const { firstName, lastName, dateOfBirth, newUsername, address, phone, cnp, email, newPassword, confirmPassword } = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
    if (error) {
        console.log(error);
    }

    if (results.length > 0) {
        return res.render('register', {
            message: 'The email is already in use'
        });
    } else if (newPassword !== confirmPassword) {
        return res.render('register', {
            message: 'Passwords do not match'
        });
    } else if (!isPasswordValid(newPassword)) {
        return res.render('register', {
            message: 'Password must contain at least 6 characters, including at least one uppercase letter, one lowercase letter, and one number.'
        });
    }

    if (!isValidCNP(cnp)) {
        return res.render('register', {
            message: 'Please enter a valid ID number.'
        });
    }


        if (!isValidPhoneNumber(phone)) {
            return res.render('register', {
                message: 'Please enter a valid phone number.'
            });
        }

        db.query('SELECT username FROM users WHERE username = ?', [newUsername], async (error, results) => {
            if (error) {
                console.log(error);
            }

            if (results.length > 0) {
                return res.render('register', {
                    message: 'The username is taken'
                });
            }
        });

        db.query('SELECT cnp FROM users WHERE cnp = ?', [cnp], async (error, results) => {
            if (error) {
                console.log(error);
            }

            if (results.length > 0) {
                return res.render('register', {
                    message: 'An account with the ID number already exists'
                });
            }
        });

        db.query('SELECT phone FROM users WHERE phone = ?', [phone], async (error, results) => {
            if (error) {
                console.log(error);
            }

            if (results.length > 0) {
                return res.render('register', {
                    message: 'The phone number is already in use'
                });
            }
        });

        let hashedPassword = await bcrypt.hash(newPassword, 8);
        console.log(hashedPassword);

        const dob = new Date(dateOfBirth);
        const currentDate = new Date();
        const age = currentDate.getFullYear() - dob.getFullYear();
        if (age < 18) {
            return res.render('register', {
                message: 'You must be at least 18 years old to register.'
            });
        }

        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({ message: 'An error occurred while processing your request.' });
            }
            const cardNumber = generateCardNumber();
            const signature = generateSignature();
            db.query('INSERT INTO users SET ?', {
                firstName: firstName,
                lastName: lastName,
                address: address,
                cnp: cnp,
                phone: phone,
                dateOfBirth: dateOfBirth,
                username: newUsername,
                email: email,
                password: hashedPassword,
                cardNumber: cardNumber,
                cardHolder: `${firstName} ${lastName}`,
                signature: signature,
            }, (error, results) => {
                if (error) {
                    return db.rollback(() => {
                        console.error('Error inserting user:', error);
                        return res.status(500).json({ message: 'An error occurred while registering the user.' });
                    });
                }

                const userId = results.insertId;

                db.query('INSERT INTO accounts SET ?', {
                    user_id: userId,
                    balance_ron: 0.00,
                    balance_usd: 0.00,
                    balance_eur: 0.00
                }, (error, results) => {
                    if (error) {
                        return db.rollback(() => {
                            console.error('Error initializing account balances:', error);
                            return res.status(500).json({ message: 'An error occurred while initializing account balances.' });
                        });
                    }

                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Commit error:', err);
                                return res.status(500).json({ message: 'An error occurred while processing your request.' });
                            });
                        }

                        return res.render('login', {
                            message: 'User registered'
                        });
                    });
                });
            });
        });
    });
};


exports.login = (req, res) => {
    const { newUsername, newPassword } = req.body;

    db.query('SELECT username, password FROM users WHERE username = ?', [newUsername], async (error, results) => {
        if (error) {
            console.log(error);
        }

        if (results.length === 0) {
            return res.render('login', {
                message: 'Invalid credentials'
            });
        }

        const user = results[0];
        console.log(user);
        const isPasswordMatch = await bcrypt.compare(newPassword, user.password);

        if (!isPasswordMatch) {
            return res.render('login', {
                message: 'Invalid credentials'
            });
        }
req.session.username = newUsername; // Corrected the variable name here
// Log the username stored in the session
        res.redirect('index');
    });
    
}

exports.updateAccount = (req, res) => {
    // Extract updated account details from request body
    const { address, password } = req.body;
  
    // Retrieve user ID from session
    const userId = req.session.username;
    console.log("User ID from session:", userId);
  
    let updateParams = [];
    let updateQuery = "UPDATE users SET ";
  
    if (address && address.trim() !== "") {
      updateQuery += "address = ?, ";
      updateParams.push(address);
    }
    if (password && password.trim() !== "") {
      // Hash the password
      bcrypt.hash(password, 8, (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing password:", err);
          return res.status(500).json({
            message: "An error occurred while updating account details",
          });
        }
        updateQuery += "password = ?, ";
        updateParams.push(hashedPassword);
  
        // Remove the trailing comma and space
        updateQuery = updateQuery.slice(0, -2);
  
        // Add the WHERE clause
        updateQuery += " WHERE username = ?";
        updateParams.push(userId);
  
        console.log("Update query:", updateQuery);
        console.log("Update parameters:", updateParams);
  
        // Execute the update query
        db.query(updateQuery, updateParams, (err, result) => {
          if (err) {
            console.error("Error updating account details:", err);
            return res.status(500).json({
              message: "An error occurred while updating account details",
            });
          }
          console.log("Update result:", result);
          console.log("Affected rows:", result.affectedRows);
          console.log("Changed rows:", result.changedRows);
          console.log("Account details updated successfully");
          res.redirect("index"); // Redirect to index page or any other page
        });
      });
    } else {
      // If password is not provided, remove it from the update parameters
      updateParams.push(userId);
  
      // Remove the trailing comma and space
      updateQuery = updateQuery.slice(0, -2);
  
      // Add the WHERE clause
      updateQuery += " WHERE username = ?";
      updateParams.push(userId);
  
      console.log("Update query:", updateQuery);
      console.log("Update parameters:", updateParams);
  
      // Execute the update query
      db.query(updateQuery, updateParams, (err, result) => {
        if (err) {
          console.error("Error updating account details:", err);
          return res.status(500).json({
            message: "An error occurred while updating account details",
          });
        }
        console.log("Update result:", result);
        console.log("Affected rows:", result.affectedRows);
        console.log("Changed rows:", result.changedRows);
        console.log("Account details updated successfully");
        res.redirect("index"); // Redirect to index page or any other page
      });
    }
  };
  

exports.logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
  
      res.redirect("/login");
    });
  };