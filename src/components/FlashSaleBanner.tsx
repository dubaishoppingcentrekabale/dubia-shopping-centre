import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

interface FlashSaleBannerProps {
  dealCount?: number;
  focusLabel?: string;
}

const getDeadline = () => {
  const deadline = new Date();
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime();
};

const getTimeLeft = (deadline: number) => {
  const diff = Math.max(deadline - Date.now(), 0);
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const FlashSaleBanner = ({ dealCount = 0 }: FlashSaleBannerProps) => {
  const [deadline] = useState(() => getDeadline());
  const [time, setTime] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const id = window.setInterval(() => setTime(getTimeLeft(deadline)), 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  return (
    <Link
      to="/deals"
      className="block border-b border-primary/20 bg-primary px-4 py-2.5 text-primary-foreground"
    >
      <div className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <Flame className="h-4 w-4" />
          Flash Deals
        </span>
        {dealCount > 0 && (
          <span className="text-primary-foreground/80">
            {dealCount} items on sale
          </span>
        )}
        <span className="tabular-nums tracking-wider">{time}</span>
      </div>
    </Link>
  );
};

export default FlashSaleBanner;
