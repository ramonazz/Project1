const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { register, login, updateAccount, logout } = require('../controllers/auth.js');

jest.mock('mysql', () => {
  const mConnection = {
    query: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
  };
  return {
    createConnection: jest.fn(() => mConnection),
  };
});

const db = require('mysql').createConnection();

describe('User Controller', () => {
  let res;
  let req;

  beforeEach(() => {
    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
    };
    req = {
      body: {},
      session: {},
    };
  });

  describe('register', () => {
    it('should return error if email is already in use', async () => {
      req.body.email = 'test@example.com';
      db.query.mockImplementationOnce((query, values, callback) => {
        callback(null, [{ email: 'test@example.com' }]);
      });

      await register(req, res);

      expect(res.render).toHaveBeenCalledWith('register', {
        message: 'The email is already in use',
      });
    });

    it('should return error if passwords do not match', async () => {
      req.body.newPassword = 'Password1';
      req.body.confirmPassword = 'Password2';

      await register(req, res);

      expect(res.render).toHaveBeenCalledWith('register', {
        message: 'Passwords do not match',
      });
    });

    it('should return error if password is invalid', async () => {
      req.body.newPassword = 'pass';
      req.body.confirmPassword = 'pass';

      await register(req, res);

      expect(res.render).toHaveBeenCalledWith('register', {
        message: 'Password must contain at least 6 characters, including at least one uppercase letter, one lowercase letter, and one number.',
      });
    });

    it('should return error if CNP is invalid', async () => {
      req.body.cnp = '123';

      await register(req, res);

      expect(res.render).toHaveBeenCalledWith('register', {
        message: 'Please enter a valid ID number.',
      });
    });

    it('should return error if phone number is invalid', async () => {
      req.body.phone = '123';

      await register(req, res);

      expect(res.render).toHaveBeenCalledWith('register', {
        message: 'Please enter a valid phone number.',
      });
    });

    it('should return error if user is under 18', async () => {
      req.body.dateOfBirth = '2010-01-01';

      await register(req, res);

      expect(res.render).toHaveBeenCalledWith('register', {
        message: 'You must be at least 18 years old to register.',
      });
    });

    it('should register user successfully', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-01-01',
        newUsername: 'johndoe',
        address: '123 Main St',
        phone: '1234567890',
        cnp: '1234567890123',
        email: 'test@example.com',
        newPassword: 'Password1',
        confirmPassword: 'Password1',
      };

      db.query.mockImplementation((query, values, callback) => {
        if (query.includes('SELECT email FROM users')) {
          callback(null, []);
        } else if (query.includes('SELECT username FROM users')) {
          callback(null, []);
        } else if (query.includes('SELECT cnp FROM users')) {
          callback(null, []);
        } else if (query.includes('SELECT phone FROM users')) {
          callback(null, []);
        } else if (query.includes('INSERT INTO users')) {
          callback(null, { insertId: 1 });
        } else if (query.includes('INSERT INTO accounts')) {
          callback(null, {});
        }
      });

      db.beginTransaction.mockImplementation(callback => callback(null));
      db.commit.mockImplementation(callback => callback(null));
      db.rollback.mockImplementation(callback => callback(null));

      await register(req, res);

      expect(res.render).toHaveBeenCalledWith('login', {
        message: 'User registered',
      });
    });
  });

  describe('login', () => {
    it('should return error if credentials are invalid', async () => {
      req.body = {
        newUsername: 'johndoe',
        newPassword: 'Password1',
      };

      db.query.mockImplementation((query, values, callback) => {
        if (query.includes('SELECT username, password FROM users WHERE username =')) {
          callback(null, []);
        }
      });

      await login(req, res);

      expect(res.render).toHaveBeenCalledWith('login', {
        message: 'Invalid credentials',
      });
    });

    it('should login user successfully', async () => {
      req.body = {
        newUsername: 'johndoe',
        newPassword: 'Password1',
      };

      const hashedPassword = await bcrypt.hash('Password1', 8);

      db.query.mockImplementation((query, values, callback) => {
        if (query.includes('SELECT username, password FROM users WHERE username =')) {
          callback(null, [{ username: 'johndoe', password: hashedPassword }]);
        }
      });

      await login(req, res);

      expect(req.session.username).toBe('johndoe');
      expect(res.redirect).toHaveBeenCalledWith('index');
    });
  });

  describe('updateAccount', () => {
    it('should update user address and password successfully', async () => {
      req.body = {
        address: '456 New St',
        password: 'NewPassword1',
      };
      req.session.username = 'johndoe';

      const hashedPassword = await bcrypt.hash('NewPassword1', 8);

      db.query.mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1, changedRows: 1 });
      });

      await updateAccount(req, res);

      expect(res.redirect).toHaveBeenCalledWith('index');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      req.session.destroy = jest.fn(callback => callback(null));

      await logout(req, res);

      expect(res.redirect).toHaveBeenCalledWith('/login');
    });
  });
});
