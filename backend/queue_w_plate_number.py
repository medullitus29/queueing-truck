
import time
from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

queue = {}
DISPLAY_DURATION = 300 #5 minutes 

@app.route("/api/queue")
def get_queue():
    global queue

    df = pd.read_excel(r"C:\Users\User\Documents\OJT\testing.xlsx")

    ready_df = df[df["Status"] == "Ready"][["Number", "Vendor", "Plate Number"]]

    current_time = time.time()

    # Add new ready items
    for _, row in ready_df.iterrows():
        order = row["Number"]

        if order not in queue:
            queue[order] = {
                "vendor": row["Vendor"],
                "plate": row["Plate Number"],
                "time": current_time
            }

    # Remove after 5 minutes
    queue = {
        k: v for k, v in queue.items()
        if current_time - v["time"] <= DISPLAY_DURATION
    }

    return jsonify([
        {
            "number": k,
            "vendor": v["vendor"],
            "plate": v["plate"]
        }
        for k, v in queue.items()
    ])

if __name__ == "__main__":
    app.run(debug=True)