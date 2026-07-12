const express = require('express');
const { signup, login } = require('../controllers/auth.controller');

const router = express.Router();

// POST /auth/signup
router.post('/signup', signup);

// POST /auth/login
router.post('/login', login);

module.exports = router;
