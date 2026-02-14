import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getAtomicTier, calculateAtomicScore } from "../utils/storage";
import "./Header.css";

export default function Header() {
    const { state } = useApp();
    const navigate = useNavigate();
    const [displayCoins, setDisplayCoins] = useState(state.coins);
    const [coinDelta, setCoinDelta] = useState(0);
    const prevCoins = useRef(state.coins);

    // Animate coin counter
    useEffect(() => {
        const diff = state.coins - prevCoins.current;
        if (diff !== 0) {
            setCoinDelta(diff);
            // Animate count
            const start = prevCoins.current;
            const end = state.coins;
            const duration = 400;
            const startTime = performance.now();

            const animate = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const current = Math.round(start + (end - start) * progress);
                setDisplayCoins(current);
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);

            // Clear delta after animation
            setTimeout(() => setCoinDelta(0), 1200);
            prevCoins.current = state.coins;
        }
    }, [state.coins]);

    const tier = getAtomicTier(calculateAtomicScore(state));

    return (
        <header className="app-header">
            <div className="header-left" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                <span className="header-logo">🌱</span>
                <span className="header-title">Atomic <span className="gold">Rise</span></span>
            </div>
            <div className="header-right">
                <div className="header-tier" style={{ color: tier.color }}>
                    {tier.icon}
                </div>
                <div className="header-coins" onClick={() => navigate("/rewards")} style={{ cursor: "pointer" }}>
                    <span className="header-coin-icon">🪙</span>
                    <span className="header-coin-count">{displayCoins}</span>
                    {coinDelta !== 0 && (
                        <span className={`coin-delta ${coinDelta > 0 ? "coin-plus" : "coin-minus"}`}>
                            {coinDelta > 0 ? `+${coinDelta}` : coinDelta}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}
