const {
  addMoney,
  transferMoney,
  payBill,
  exchangeMoney
} = require('../controllers/transf.js');
const db = require('mysql').createConnection();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

describe('Money Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      session: {}, 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('addMoney function', () => {
    it('should return 400 if amount is not provided', async () => {
      await addMoney(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid amount' });
    });

    it('should return 400 if amount is zero', async () => {
      req.body.amount = 0;
      await addMoney(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid amount' });
    });

  
  });

  describe('transferMoney function', () => {
    it('should return 400 if amount is not provided', async () => {
      await transferMoney(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid amount' });
    });

  });

  describe('payBill function', () => {
    it('should return 400 if bill amount is not provided', async () => {
      await payBill(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid bill amount' });
    });

    it('should return 400 if bill amount is zero', async () => {
      req.body.billAmount = 0;
      await payBill(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid bill amount' });
    });


  });

 
});
