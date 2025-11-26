import { useEffect, useMemo, useState } from "react";
import TimeRangeSelector from "../components/TimeRangeSelector";
import TemperatureChart, {
  TemperaturePoint,
} from "../components/TemperatureChart";
import { GetHistoryData } from "../../wailsjs/go/backend/App";
import { backend } from "../../wailsjs/go/models";

type RangeId = "1h" | "1d" | "1w";



export default function History() {
  const [range, setRange] = useState<RangeId>("1h");
  const [data, setData] = useState<TemperaturePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const history: backend.HistoryEntry[] = await GetHistoryData(range);
        const points: TemperaturePoint[] = (history || []).map((entry) => ({
          temperature: entry.temp,
          timestamp: entry.datetime,
        }));

        setData(points);
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer l'historique.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [range]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { min: null as number | null, max: null as number | null, avg: null as number | null };
    }
    const temps = data.map((p) => p.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = temps.reduce((sum, t) => sum + t, 0) / temps.length;
    return { min, max, avg };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Historique des températures
          </h2>
          <p className="text-sm text-slate-400">
            Visualisation des mesures enregistrées dans le temps.
          </p>
        </div>

        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="text-sm text-rose-400 bg-rose-950/40 border border-rose-500/40 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-fridgeCard/80 border border-slate-800 rounded-2xl shadow-xl p-4 md:p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-300">Chargement des données…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-slate-300">
            Aucune donnée disponible pour cette période.
          </p>
        ) : (
          <>
            <TemperatureChart data={data} />

            
          </>
        )}
      </div>
    </div>
  );
}
