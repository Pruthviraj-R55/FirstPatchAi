def validate_username(username):
    if username is None:
        raise ValueError("Username cannot be None")
    return True