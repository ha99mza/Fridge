import { useEffect, useState } from "react";
import TemperatureCard from "../components/TemperatureCard";
import { GetTemperature } from "../../wailsjs/go/backend/App";

export default function CurrentTemperature() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let intervalId: number | undefined;

    const fetchTemperature = async () => {
      try {
        setError("");
        const temp = await GetTemperature();
        setTemperature(temp);

        if (temp <= 0) setStatus("Trop froid");
        else if (temp <= 8) setStatus("Normal");
        else setStatus("Trop chaud");

        const ts = new Date();
        setLastUpdate(
          ts.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch (err) {
        console.error("Impossible de récupérer la température", err);
        setError("Impossible de récupérer la température.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemperature();
    intervalId = window.setInterval(fetchTemperature, 10000);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
        Température actuelle du réfrigérateur
      </h2>

      {error && (
        <div className="mb-3 text-sm text-rose-400 bg-rose-950/40 border border-rose-500/40 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <TemperatureCard
        temperature={temperature}
        status={loading ? "Chargement..." : status}
        lastUpdate={lastUpdate}
      />
    </div>
  );
}
