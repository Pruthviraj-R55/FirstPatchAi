
function isValidEmail(email) {
    if (!email) {
        return true;
    }

    return email.includes("@");
}

module.exports = { isValidEmail };
