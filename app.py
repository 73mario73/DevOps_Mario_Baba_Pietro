# riga cambiata per test regola git
import os 

from flask import Flask, jsonify 

app = Flask(__name__) 
EVENTI = [{"id": 1, "titolo": "Jazz in Rocca"}] 
@app.get("/health") 
def health():
    return jsonify(status="ok") 
@app.get("/version") 
def version():
    return jsonify(version=os.environ.get("APP_VERSION", "dev")) 
@app.get("/eventi") 
def eventi():
    return jsonify(EVENTI) 
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)