import run

while True:
    text = input('run > ')
    result, error = run.run('<stdin>', text)

    if error:
        print(error.as_string())
    else:
        print(result)