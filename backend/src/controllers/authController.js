const { createClient } = require("@supabase/supabase-js");

const supabase = require("../config/supabase");
const authModel = require("../models/authModel");

// Separate Supabase client for user login
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

// =========================================
// REGISTER
// =========================================

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      charityId,
      charityPercentage,
    } = req.body;

    if (!email || !password || !fullName || !charityId) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password, full name and charity are required",
      });
    }

    // Create Supabase Auth user
    const { data, error } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Create profile
    const profile = await authModel.createProfile(
      data.user.id,
      fullName,
      charityId,
      charityPercentage
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      profile,
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// =========================================
// LOGIN
// =========================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Login using separate auth client
    const { data, error } =
      await authClient.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Get profile from database
    const profile =
      await authModel.getProfileById(
        data.user.id
      );

    res.status(200).json({
      success: true,
      message: "Login successful",

      token: data.session.access_token,

      user: {
        id: data.user.id,
        email: data.user.email,
        profile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// =========================================
// EXPORTS
// =========================================

module.exports = {
  register,
  login,
};