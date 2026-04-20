import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

function App() {
  const [queue, setQueue] = useState([]);
  const scrollRef = useRef(null);
  const [clock, setClock] = useState("");

  // 🔹 Manila clock
  useEffect(() => {
    function updateClock() {
      const options = {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      };
      const now = new Date().toLocaleTimeString("en-PH", options);
      setClock(now);
    }
    const interval = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(interval);
  }, []);

  // 🔹 Fetch data
  useEffect(() => {
    const queueRef = ref(db, "queue");
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setQueue([]);
        return;
      }
      const list = Object.values(data);
      const limited = list.slice(0, 10);
      setQueue([...limited, ...limited]); // duplicate for seamless scroll
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Auto-scroll
  useEffect(() => {
    const speed = 1;
    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;
      container.scrollTop += speed;
      if (container.scrollTop >= container.scrollHeight / 2) {
        container.scrollTop = 0;
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "white",
        color: "black"
      }}
    >
      {/* ✅ Coca-Cola style header */}
  
     <header
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#e41c1c", // Coca-Cola red
    color: "white",
    padding: "37px",
    flexShrink: 0
  }}
>
        {/* ✅ Coca-Cola logo from online source */}
  <img
    src="assets/coca-cola-logo-2.png"
    alt="Coca-Cola Logo"
    style={{
      height: "300px", // responsive size
      marginTop:"-100px",
      marginBottom:"-100px",
      objectFit: "contain"
    }}
  />

  <div
    style={{
      fontSize: "clamp(18px, 4vw, 32px)",
      fontWeight: "bold"
    }}
  >
    {clock}
  </div>
</header>

      {/* ✅ Main content fills screen */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 54px)",
            marginBottom: "20px",
            color: "black" // ✅ black font
          }}
        >
        READY FOR PICKUP
        </h1>

        {queue.length === 0 ? (
          <h2 style={{ fontSize: "clamp(40px, 4vw, 32px)", color: "black" }}>
            No orders ready
          </h2>
        ) : (
          <div style={{ width: "100%", maxWidth: "900px" }}>
            <table
              style={{
                color: "black",
                width: "100%",
                fontSize: "clamp(18px, 3vw, 30px)",
                tableLayout: "fixed",
                borderCollapse: "collapse",
                border: "1px solid black" // ✅ visible border
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "10px", border: "1px solid black" }}>
                    Order No.
                  </th>
                  <th style={{ padding: "10px", border: "1px solid black" }}>
                    Vendor
                  </th>
                  <th style={{ padding: "10px", border: "1px solid black" }}>
                    Plate No.
                  </th>
                  <th style={{ padding: "10px", border: "1px solid black" }}>
                    Docking No.
                  </th>
                </tr>
              </thead>
            </table>

            <div
              ref={scrollRef}
              style={{
                height: "50vh", // responsive height
                overflow: "hidden"
              }}
            >
              <table
                style={{
                  width: "100%",
                  fontSize: "clamp(18px, 3vw, 30px)",
                  borderCollapse: "collapse",
                  border: "1px solid black" // ✅ visible border
                }}
              >
                <tbody>
                  {queue.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: "10px", width: "25%", border: "1px solid black" }}>
                        {item.number}
                      </td>
                      <td style={{ padding: "10px", width: "25%", border: "1px solid black" }}>
                        {item.vendor}
                      </td>
                      <td style={{ padding: "10px", width: "25%", border: "1px solid black" }}>
                        {item.plate}
                      </td>
                      <td style={{ padding: "10px", width: "25%", border: "1px solid black" }}>
                        {item.docking}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
