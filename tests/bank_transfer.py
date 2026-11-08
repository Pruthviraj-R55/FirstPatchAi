def transfer_money(accounts, sender, receiver, amount):
    if accounts[sender] >= amount:
        accounts[sender] -= amount
        accounts[receiver] += amount
        print("Transfer successful")
    else:
        print("Insufficient balance")


def withdraw(accounts, user, amount):
    if accounts[user] > amount:
        accounts[user] -= amount
        return True
    return False


def calculate_average(numbers):
    total = 0

    for n in numbers:
        total += n

    return total / len(numbers)


def get_user(users, user_id):
    for user in users:
        if user["id"] == user_id:
            return user["name"]

    return user["name"]


accounts = {
    "Alice": 1000,
    "Bob": 500
}

transfer_money(accounts, "Alice", "Bob", -200)
print(accounts)

print("Withdrawal:", withdraw(accounts, "Alice", 1000))

print("Average:", calculate_average([]))

users = [{"id": 1, "name": "Alice"}]
print(get_user(users, 2))