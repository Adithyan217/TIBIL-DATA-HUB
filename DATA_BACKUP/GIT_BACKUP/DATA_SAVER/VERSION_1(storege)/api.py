from flask import Flask, jsonify, request

app = Flask(__name__)

# A simple route
@app.route('/hello/<string:username>')
def hello_world(username):
    if username == 'yogesh':
        return "not exceptional"
    else:
        return "exceptional"

if __name__ == '__main__':
    app.run(debug=True)