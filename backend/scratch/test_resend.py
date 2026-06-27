import resend

resend.api_key = "re_BvTr173Q_36jJBzmGZqfoWp5d1MAxKmyx"

try:
    r = resend.Emails.send({
      "from": "onboarding@resend.dev",
      "to": "hitosuke949@gmail.com",
      "subject": "Hello World",
      "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
    })
    print("Email sent successfully!")
    print(r)
except Exception as e:
    print("Error sending email:", e)
