import pandas as pd
import firebase_admin
from firebase_admin import credentials, db
import time, shutil, tempfile, os

# ================= CONFIG =================
EXCEL_FILE = r"C:\Users\User\OneDrive\Documents\testing.xlsx"
CHECK_INTERVAL = 2
TARGET_VENDOR = "LSP"

# ================= FIREBASE INIT =================
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://queueing-truck-916d0-default-rtdb.asia-southeast1.firebasedatabase.app"
})

queue_ref = db.reference("queue")
processed_ref = db.reference("processed")

# ================= SANITIZE =================
def sanitize_value(val, default=""):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return default
    return val

# ================= SAFE EXCEL READ =================
def read_excel_safely(path):
    try:
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, "temp_excel_copy.xlsx")
        shutil.copy2(path, temp_path)
        df = pd.read_excel(temp_path, sheet_name="Summarized Plan", engine="openpyxl")
        return df
    except Exception as e:
        print("Excel read error:", e)
        return None

# ================= MAIN LOOP =================
while True:
    try:
        print("\nChecking Excel...")

        df = read_excel_safely(EXCEL_FILE)
        if df is None:
            time.sleep(CHECK_INTERVAL)
            continue

        df = df.where(pd.notnull(df), None)
        df.columns = df.columns.str.strip().str.upper()

        # Force STATUS column at index 15 (column P) if needed
        cols = list(df.columns)
        if len(cols) > 15:
            cols[15] = "STATUS"
        df.columns = cols

        current_time = int(time.time())
        processed_data = processed_ref.get() or {}

        # ================= PROCESS EXCEL =================
        for idx, row in df.iterrows():
            try:
                shipment_val = row.get("SHIPMENT")
                if shipment_val is None:
                    continue

                try:
                    order_id = str(int(float(shipment_val)))
                except:
                    continue

                # Skip already-processed entries
                if order_id in processed_data:
                    continue

                vendor = sanitize_value(row.get("VENDOR"), "")
                raw_status = row.get("STATUS")

                # ================= REMOVAL LOGIC =================
                # If STATUS has ANY value (especially 1), remove from queue and mark processed
                status_has_value = (
                    raw_status is not None and
                    not (isinstance(raw_status, float) and pd.isna(raw_status)) and
                    str(raw_status).strip() != ""
                )

                if status_has_value:
                    existing = queue_ref.child(order_id).get()
                    if existing is not None:
                        queue_ref.child(order_id).delete()
                        processed_ref.child(order_id).set(True)
                        print(f"Removed & processed: {order_id} (STATUS = {raw_status})")
                    continue  # Don't re-add it

                # ================= ADD LOGIC =================
                # Only add if vendor matches AND status is empty
                if TARGET_VENDOR.lower() in vendor.lower():
                    plate = sanitize_value(row.get("PLATE"), "")
                    new_data = {
                        "number": int(float(shipment_val)),
                        "vendor": vendor,
                        "plate": plate,
                        "status": "Ready",
                        "timestamp": current_time
                    }

                    existing = queue_ref.child(order_id).get()
                    if existing is None:
                        queue_ref.child(order_id).set(new_data)
                        print(f"Added: {order_id}")
                    else:
                        if (
                            existing.get("plate") != new_data["plate"] or
                            existing.get("vendor") != new_data["vendor"] or
                            existing.get("status") != new_data["status"]
                        ):
                            queue_ref.child(order_id).update(new_data)
                            print(f"Updated: {order_id}")

            except Exception as e:
                print(f"Row error (idx {idx}):", e)

        time.sleep(CHECK_INTERVAL)

    except Exception as e:
        print("SYSTEM ERROR:", e)
        time.sleep(5)