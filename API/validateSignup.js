function validateSignup({ firstName, lastName, email, password, role })
{
    if (!firstName || !lastName || !email || !password || !role)
    {
        return { valid: false, error: "All fields are required." };
    }
    if (password.length < 8)
    {
        return { valid: false, error: "Password must be at least 8 characters." };
    }
    if (!['Coach', 'Athlete'].includes(role))
    {
        return { valid: false, error: "Role must be Coach or Athlete." };
    }
    return { valid: true, normalizedEmail: email.toLowerCase() };
}

module.exports = validateSignup;