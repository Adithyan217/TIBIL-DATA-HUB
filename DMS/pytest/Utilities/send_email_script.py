import configparser
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os


# test
class ReadConfig:
    @staticmethod
    def get_config_path():
        return os.path.abspath(os.path.join(os.path.dirname(__file__), '../Configuration/config.init'))

    @staticmethod
    def get_config():
        config_path = ReadConfig.get_config_path()
        print(f"Reading config file from: {config_path}")
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Config file not found: {config_path}")

        config = configparser.ConfigParser()
        config.read(config_path)
        return config


def send_email(username, password, recipient_email):
    subject = "API Test Execution Report"
    body = "Please find the attached Test execution report."

    sender_email = username
    receiver_email = recipient_email

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    # Attach the test report file to gmail
    # with open('./reports/Pytest_report.html', 'rb') as f:
    #     attach = MIMEApplication(f.read(), _subtype="html")
    #     attach.add_header('Content-Disposition', 'attachment', filename="Pytest_report.html")
    #     msg.attach(attach)

    # Attach the Security report to gmail
    with open('./report_html.html', 'rb') as f:
        attach = MIMEApplication(f.read(), _subtype="html")
        attach.add_header('Content-Disposition', 'attachment', filename="report_html.html")
        msg.attach(attach)

    # Attach the test log file to Gmail
    # with open('./Logs/API_TEST.log', 'rb') as f:
    #     attach = MIMEApplication(f.read(), _subtype="log")
    #     attach.add_header('Content-Disposition', 'attachment', filename="API_TEST.log")
    #     msg.attach(attach)

    # Send the email
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            print("Logging in...")
            server.login(username, password)
            print("Sending email...")
            server.sendmail(sender_email, receiver_email, msg.as_string())
            print("Email sent successfully.")
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {e.smtp_code} - {e.smtp_error.decode()}")


if __name__ == "__main__":
    config = ReadConfig.get_config()
    gmail_username = config['EMAIL']['username']
    gmail_password = config['EMAIL']['password']
    recipient_email = config['EMAIL']['recipient_email']

    send_email(gmail_username, gmail_password, recipient_email)